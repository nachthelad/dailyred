// Stage only browser assets; never upload the repository or toolchain.
import { cpSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const root = resolve(import.meta.dirname, '..');
const stage = join(root, '.toolchain/vercel-site');
mkdirSync(stage, { recursive: true });
for (const entry of readdirSync(join(root, 'web'))) cpSync(join(root, 'web', entry), join(stage, entry), { recursive: true });
writeFileSync(join(stage, 'vercel.json'), JSON.stringify({ version: 2, framework: null, buildCommand: '', outputDirectory: '.', headers: [{ source: '/game/(.*).gba.gz', headers: [{ key: 'Content-Type', value: 'application/octet-stream' }] }] }, null, 2));
const files = [];
function walk(dir, prefix = '') {
  for (const name of readdirSync(dir)) {
    if (name === '.vercel' || name === '.gitignore') continue;
    const file = join(dir, name), path = prefix + name;
    if (statSync(file).isDirectory()) walk(file, path + '/');
    else files.push({ path, bytes: statSync(file).size, sha256: createHash('sha256').update(readFileSync(file)).digest('hex') });
  }
}
walk(stage);
writeFileSync(join(root, '.toolchain/vercel-manifest.json'), JSON.stringify(files, null, 2));
console.log(JSON.stringify({ stage, files: files.length, bytes: files.reduce((total, file) => total + file.bytes, 0), paths: files.map(file => file.path) }, null, 2));
