// Focused regression: public seed bypass, CSP compatibility and deployment scope.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
process.env.DAILYRED_GAME_DIR = fileURLToPath(new URL('../.toolchain/pokefirered-es', import.meta.url));
const { ROOT, startServer, launchBrowser, waitFor } = await import('./lib.mjs');
const { practiceSeedFor } = await import('../web/rom-config.js');
for (const host of ['daily-red-es.vercel.app', 'localhost.evil.test', '127.0.0.1.evil.test']) {
  assert.equal(practiceSeedFor(new URL(`https://${host}/?seed=42`)), null);
}
for (const host of ['localhost', '127.0.0.1', '[::1]']) assert.equal(practiceSeedFor(new URL(`http://${host}/?seed=42`)), 42);
const stage = join(ROOT, '.toolchain/vercel-site');
const config = JSON.parse(readFileSync(join(stage, 'vercel.json')));
const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key.toLowerCase(), value]));
assert.equal(headers['x-content-type-options'], 'nosniff');
assert.equal(headers['x-frame-options'], 'DENY');
assert.ok(!readdirSync(stage).some(name => name.startsWith('.env')));
const server = await startServer(), browser = await launchBrowser();
const publicBase = process.argv[2]?.replace(/\/$/, '');
const base = publicBase || 'https://daily-red-audit.example';
try {
  const page = await browser.newPage({ locale: 'es-AR' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener('securitypolicyviolation', event => window.cspViolations.push(event.violatedDirective));
  });
  // Serve local bytes on a non-loopback origin, with the actual production CSP.
  if (!publicBase) await page.route('https://daily-red-audit.example/**', async route => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `${server.url}${url.pathname}${url.search}` });
    await route.fulfill({ response, headers: { ...response.headers(), ...headers } });
  });
  await page.goto(`${base}/?seed=42&lang=es`);
  await page.waitForFunction(() => window.dailyRed);
  assert.equal(new URL(page.url()).searchParams.has('seed'), false);
  assert.equal(await page.locator('#practice-note').isVisible(), false);
  await page.locator('#play').click(); await page.locator('#begin').click();
  await page.waitForFunction(() => window.dailyRed.emulator, null, { timeout: 60000 });
  await page.evaluate(() => { window.emu = window.dailyRed.emulator; });
  await waitFor(page, state => state.inOverworld, { timeoutMs: 30000 });
  assert.deepEqual(await page.evaluate(() => window.cspViolations), []);
  assert.deepEqual(errors, []);
  await page.evaluate(async () => {
    const { today } = await import('/daily.js');
    localStorage.setItem('dailyred-stats', JSON.stringify({ wins: 1, losses: 0, lastPlayed: today(), lastResult: 'won' }));
  });
  await page.goto(`${base}/?seed=999&lang=es`);
  await page.waitForFunction(() => window.dailyRed);
  assert.equal(await page.locator('#play').isVisible(), false);
  assert.equal(await page.locator('#practice-note').isVisible(), false);
  console.log('PASS: public seeds ignored, daily limit retained, real Spanish ROM starts under CSP without violations; staged secrets excluded.');
} finally { await browser.close(); server.close(); }
