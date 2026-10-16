// Stage only browser assets; never upload the repository or toolchain.
import { cpSync, lstatSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const root = resolve(import.meta.dirname, '..');
const stage = join(root, '.toolchain/vercel-site');
// Check the exact workspace destination before removing obsolete staged files.
if (relative(root, resolve(stage)) !== join('.toolchain', 'vercel-site')) throw new Error('Unsafe staging destination');
for (const directory of [join(root, '.toolchain'), stage]) {
  if (existsSync(directory) && lstatSync(directory).isSymbolicLink()) throw new Error('Staging symlinks are not allowed');
}
mkdirSync(stage, { recursive: true });
for (const name of readdirSync(stage)) {
  if (name !== '.vercel') rmSync(join(stage, name), { recursive: true, force: true });
}
const assets = [
  'pwa.js', 'sw.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
  'app.js', 'daily.js', 'favicon.svg', 'game-files.js', 'game-link.js', 'i18n.js',
  'index.html', 'licenses.txt', 'rom-config.js', 'style.css', 'translation-credits.txt',
  'flags/es.svg', 'flags/en.svg', 'game/dailyred-es.gba.gz', 'game/dailyred.gba.gz', 'game/red.png',
  'vendor/mgba_libretro.js', 'vendor/mgba_libretro.wasm', 'vendor/nostalgist.js',
  'vendor/nostalgist.LICENSE.txt', 'vendor/pixelify-sans.OFL.txt', 'vendor/pixelify-sans.woff2',
];
const web = join(root, 'web');
for (const name of assets) {
  const source = join(web, name);
  for (let path = source; path !== web; path = dirname(path)) {
    if (lstatSync(path).isSymbolicLink()) throw new Error(`Asset symlinks are not allowed: ${name}`);
  }
  mkdirSync(dirname(join(stage, name)), { recursive: true });
  cpSync(source, join(stage, name));
}
writeFileSync(join(stage, '.vercelignore'), '.env*\n.git\n.gitignore\n.vercel\n');
// Keep security headers identical for Git builds and manually staged uploads.
const { headers } = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
writeFileSync(join(stage, 'vercel.json'), JSON.stringify({
  version: 2, framework: null, buildCommand: '', outputDirectory: '.',
  headers,
}, null, 2));
const files = [];
function walk(dir, prefix = '') {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const file = join(dir, name), path = prefix + name;
    if (statSync(file).isDirectory()) walk(file, path + '/');
    else files.push({ path, bytes: statSync(file).size, sha256: createHash('sha256').update(readFileSync(file)).digest('hex') });
  }
}
walk(stage);
writeFileSync(join(root, '.toolchain/vercel-manifest.json'), JSON.stringify(files, null, 2));
console.log(JSON.stringify({ stage, files: files.length, bytes: files.reduce((total, file) => total + file.bytes, 0), paths: files.map(file => file.path) }, null, 2));
