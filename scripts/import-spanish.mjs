// Import TEXT ONLY from the pinned FireRed Latino sources downloaded to D:.
// No battle code, data, IDs, fonts, buffers or mechanics are imported.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const source = join(root, '.toolchain/downloads/es-source');
const files = ['src/battle_message.c', 'src/strings.c', 'src/move_descriptions.c',
  'src/data/text/abilities.h', 'src/data/text/move_names.h', 'src/data/text/nature_names.h', 'src/battle_main.c'];
export const namedPattern = () => /(const\s+u8\s+(\w+)\s*\[\s*\]\s*=\s*_\()((?:"(?:\\.|[^"\\])*"\s*)+)(\))/g;
export const indexedPattern = () => /(\[([A-Z][A-Z0-9_]+)\]\s*=\s*_\()((?:"(?:\\.|[^"\\])*"\s*)+)(\))/g;
export const rawText = (quoted) => [...quoted.matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) => m[1]).join('');
export const entries = (text, pattern) => {
  const map = new Map();
  for (const m of text.matchAll(pattern())) if (!map.has(m[2])) map.set(m[2], rawText(m[3]));
  return map;
};

if (process.argv[1] === import.meta.filename) {
  const catalog = {}, audit = { missing: {}, unchanged: {}, longNames: [], unknownTokens: [] };
  const charmap = readFileSync(join(root, 'pokefirered/charmap.txt'), 'utf8');
  const tokens = new Set([...charmap.matchAll(/^([A-Z][A-Z0-9_]*)\s*=/gm)].map((m) => m[1]));
  for (const file of files) {
    const original = readFileSync(join(root, 'pokefirered', file), 'utf8');
    const translated = readFileSync(join(source, file), 'utf8');
    const out = {};
    for (const pattern of [namedPattern, indexedPattern]) {
      const en = entries(original, pattern), es = entries(translated, pattern);
      for (const [key, from] of en) {
        if (!es.has(key)) { (audit.missing[file] ??= {})[key] = from; continue; }
        const to = es.get(key).replace(/\{B_(?:ATK|DEF)_OA\}/g, 'o').replace(/\r?\n/g, '\\n');
        if (to === from) { (audit.unchanged[file] ??= {})[key] = from; continue; }
        out[key] = { from, to };
        const limit = key.startsWith('MOVE_') ? 12 : key.startsWith('ABILITY_') ? 12 : key.startsWith('TYPE_') ? 6 : null;
        if (limit && to.length > limit) audit.longNames.push({ file, key, to, limit });
        for (const token of to.matchAll(/\{([^}]+)\}/g)) {
          if (!tokens.has(token[1].split(' ')[0])) audit.unknownTokens.push({ file, key, token: token[1] });
        }
      }
    }
    catalog[file] = out;
  }
  const originalItems = JSON.parse(readFileSync(join(root, 'pokefirered/src/data/items.json'))).items;
  const esItems = new Map(JSON.parse(readFileSync(join(source, 'src/data/items.json'))).items.map((i) => [i.itemId, i]));
  catalog['src/data/items.json'] = Object.fromEntries(originalItems.map((i) => {
    const es = esItems.get(i.itemId);
    if (!es) throw new Error(`Missing item ${i.itemId}`);
    if (es.english.length > 13) audit.longNames.push({ file: 'src/data/items.json', key: i.itemId, to: es.english, limit: 13 });
    return [i.itemId, { name: es.english, description: es.description_english }];
  }));
  mkdirSync(join(root, 'localization/es'), { recursive: true });
  writeFileSync(join(root, 'localization/es/catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  writeFileSync(join(source, 'audit.json'), JSON.stringify(audit, null, 2));
  console.log(JSON.stringify({ counts: Object.fromEntries(Object.entries(catalog).map(([f, v]) => [f, Object.keys(v).length])),
    missing: Object.fromEntries(Object.entries(audit.missing).map(([f, v]) => [f, Object.keys(v).length])),
    longNames: audit.longNames, unknownTokens: audit.unknownTokens }, null, 2));
}
