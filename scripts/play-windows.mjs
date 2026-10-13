import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const chrome = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean).find(existsSync);
if (!chrome) throw new Error('Chrome no encontrado. Indicá CHROME_PATH.');
const server = spawn(process.execPath, [join(root, 'scripts/serve.mjs')], { stdio: ['ignore', 'pipe', 'inherit'] });
const record = join(root, '.toolchain/server.json');
process.on('exit', () => {
  server.kill();
  try {
    if (JSON.parse(readFileSync(record, 'utf8')).launcher === process.pid) unlinkSync(record);
  } catch {}
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.kill(); process.exit(0); });
let opened = false;
server.stdout.on('data', (data) => {
  process.stdout.write(data);
  if (opened || !String(data).includes('http://localhost:')) return;
  opened = true;
  writeFileSync(record, JSON.stringify({ launcher: process.pid, server: server.pid }));
  const url = 'http://localhost:8080/' + (process.env.DAILYRED_PRACTICE === '1' ? '?seed=42' : '');
  const browser = spawn(chrome, [`--user-data-dir=${resolve(root, '.toolchain/chrome-profile')}`,
    `--disk-cache-dir=${resolve(root, '.toolchain/cache/chrome')}`, '--no-first-run', '--no-default-browser-check', url],
    { detached: true, stdio: 'ignore' });
  browser.unref();
  console.log('Para detener el servidor: Ctrl+C en esta ventana.');
});
server.on('exit', (code) => {
  let stopped = false;
  try {
    const saved = JSON.parse(readFileSync(record, 'utf8'));
    stopped = saved.launcher === process.pid && saved.stopRequested === true;
  } catch {}
  process.exit(stopped ? 0 : code || 0);
});
server.on('error', (error) => { console.error(error.message); process.exit(1); });
