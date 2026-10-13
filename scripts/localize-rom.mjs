// Reproducible Spanish build inputs, isolated from the original English checkout.
import { readFileSync, writeFileSync, existsSync, cpSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { namedPattern, indexedPattern, rawText } from './import-spanish.mjs';
import { wrap } from './rom-text.mjs';
const root = resolve(import.meta.dirname, '..');
const source = join(root, 'pokefirered');
const target = join(root, '.toolchain/pokefirered-es');
const catalog = JSON.parse(readFileSync(join(root, 'localization/es/catalog.json')));
const charmap = readFileSync(join(source, 'charmap.txt'), 'utf8');
const tokens = new Set([...charmap.matchAll(/^([A-Z][A-Z0-9_]*)\s*=/gm)].map((m) => m[1]));
const prepared = new Map(), report = { strings: {}, assets: [], descriptions: 0 };
const visible = (text) => text.replace(/\{[^}]+\}/g, 'X').replace(/\\[nlp]/g, '\n');
for (const [file, translations] of Object.entries(catalog)) {
  let text = readFileSync(join(source, file), 'utf8');
  if (file.endsWith('.json')) {
    const data = JSON.parse(text);
    for (const item of data.items) {
      const tr = translations[item.itemId];
      if (!tr) throw new Error(`Missing item ${item.itemId}`);
      if (visible(tr.name).length > 13) throw new Error(`Item name too long: ${item.itemId}`);
      item.english = tr.name; item.description_english = tr.description;
    }
    text = JSON.stringify(data, null, 2) + '\n';
    report.strings[file] = data.items.length * 2;
  } else {
    const used = new Set();
    for (const pattern of [namedPattern, indexedPattern]) text = text.replace(pattern(), (all, start, key, quoted, end) => {
      const tr = translations[key];
      if (!tr) return all;
      if (tr.to.includes('\\\\')) throw new Error(`Double-escaped text control: ${file}:${key}`);
      if (rawText(quoted) !== tr.from) throw new Error(`Source changed: ${file}:${key}`);
      for (const token of tr.to.matchAll(/\{([^}]+)\}/g)) {
        if (!tokens.has(token[1].split(' ')[0])) throw new Error(`Unsupported token ${file}:${key}:${token[1]}`);
      }
      const dynamic = (str) => [...str.matchAll(/\{((?:B_|STR_VAR_|DYNAMIC)[^}]+)\}/g)].map((m) => m[1]);
      for (const name of dynamic(tr.from)) if (!dynamic(tr.to).includes(name)) throw new Error(`Missing placeholder ${key}:${name}`);
      const limit = key.startsWith('MOVE_') ? 12 : key.startsWith('ABILITY_') ? 12 : key.startsWith('TYPE_') ? 6 : null;
      if (limit && visible(tr.to).length > limit) throw new Error(`Name too long: ${key}`);
      if (file === 'src/data/text/abilities.h' && key.startsWith('s') && visible(tr.to).length > 51) throw new Error(`Ability description too long: ${key}`);
      if (file === 'src/move_descriptions.c') {
        report.descriptions++;
        const lines = visible(tr.to).split('\n');
        if (lines.length > 4 || lines.some((line) => wrap(line).length !== 1)) throw new Error(`Description overflow: ${key}`);
      }
      used.add(key);
      return `${start}"${tr.to}"${end}`;
    });
    for (const key of Object.keys(translations)) if (!used.has(key)) throw new Error(`Unknown translation ${file}:${key}`);
    report.strings[file] = used.size;
  }
  prepared.set(file, Buffer.from(text));
}
if (report.descriptions !== 354) throw new Error('Incomplete movement descriptions');
prepared.set('data/maps/DailyRed_Summit/text.inc', readFileSync(join(root, 'localization/es/summit.inc')));
const regionsFile = 'src/data/region_map/region_map_sections.json';
const regions = JSON.parse(readFileSync(join(source, regionsFile)));
regions.map_sections.find((s) => s.id === 'MAPSEC_NAVEL_ROCK').name = 'CUMBRE DE RED';
prepared.set(regionsFile, Buffer.from(JSON.stringify(regions, null, 2) + '\n'));
// The translated atlas uses one preview palette; the runtime requires the
// original seven palette banks. Keep their colors via an explicit JASC palette.
const bg = readFileSync(join(source, 'graphics/summary_screen/bg.png'));
let palette;
for (let at = 8; at < bg.length;) {
  const size = bg.readUInt32BE(at), type = bg.toString('ascii', at + 4, at + 8);
  if (type === 'PLTE') { palette = bg.subarray(at + 8, at + 8 + size); break; }
  at += size + 12;
}
if (!palette || palette.length < 112 * 3) throw new Error('Summary palette banks missing');
const colors = [];
for (let at = 0; at < palette.length; at += 3) colors.push([...palette.subarray(at, at + 3)].join(' '));
prepared.set('graphics/summary_screen/bg.pal', Buffer.from('JASC-PAL\n0100\n' + colors.length + '\n' + colors.join('\n') + '\n'));
const assets = JSON.parse(readFileSync(join(root, 'localization/es/assets.json')));
for (const asset of assets) {
  const bytes = readFileSync(join(root, 'localization/es', asset.file));
  if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw new Error(`Asset checksum: ${asset.file}`);
  prepared.set(asset.target, bytes);
  report.assets.push(asset.target);
}
if (!process.argv.includes('--check')) {
  if (!existsSync(target)) cpSync(source, target, { recursive: true, preserveTimestamps: true, filter: (p) => p !== join(source, '.git') });
  const tracked = execFileSync('git', ['-C', source, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { maxBuffer: 64 << 20 }).toString().split('\0').filter(Boolean);
  for (const file of tracked) if (!prepared.has(file)) prepared.set(file, readFileSync(join(source, file)));
  for (const [file, bytes] of prepared) {
    const dest = join(target, file);
    if (existsSync(dest) && readFileSync(dest).equals(bytes)) continue;
    mkdirSync(resolve(dest, '..'), { recursive: true });
    writeFileSync(dest, bytes);
  }
  writeFileSync(join(root, '.toolchain/spanish-coverage.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
