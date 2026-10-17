import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
process.env.DAILYRED_GAME_DIR = fileURLToPath(new URL('../.toolchain/pokefirered-es', import.meta.url));
const { startServer, launchBrowser, waitFor } = await import('./lib.mjs');
const server = process.argv[2] ? null : await startServer();
const url = process.argv[2] || server.url;
const browser = await launchBrowser();
const legacy = { wins: 7, losses: 3, winStreak: 4, dayStreak: 8, lastPlayed: '2026-10-17', lastResult: 'won', pending: null };
try {
  const page = await browser.newPage({ serviceWorkers: 'block', locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' });
  await page.clock.setFixedTime(new Date('2026-10-17T10:00:00-03:00'));
  await page.addInitScript(value => {
    if (!localStorage.getItem('dailyred-stats')) localStorage.setItem('dailyred-stats', JSON.stringify(value));
  }, legacy);
  await page.goto(`${url}/?lang=es`);
  assert(await page.locator('#play').isVisible(), 'legacy completed game reopens');
  assert.equal(await page.locator('#stat-wins').textContent(), '7');
  assert.equal(await page.locator('#stat-losses').textContent(), '3');
  assert.equal(await page.locator('#stat-day-streak').textContent(), '8');
  assert.equal(await page.locator('#stat-win-streak').textContent(), '4');
  await page.reload(); assert(await page.locator('#play').isVisible());
  await page.click('#play'); await page.check('[value=electric]'); await page.click('#begin');
  await page.waitForFunction(() => window.dailyRed.emulator, null, { timeout: 120000 });
  await page.evaluate(() => { window.emu = window.dailyRed.emulator; });
  await waitFor(page, status => status.inOverworld, { timeoutMs: 60000 });
  // Simulate a known result in the real emulator to exercise the site's polling
  // and daily teardown without playing a battle. This affects only this test profile.
  await page.evaluate(async () => {
    const { dailySeed, today } = await import('/daily.js');
    const heap = window.dailyRed.emulator.getEmscriptenModule().HEAPU8;
    const words = new Uint32Array(heap.buffer, heap.byteOffset, heap.byteLength >>> 2);
    const magic = new Uint32Array(new TextEncoder().encode('DAILYRED-STATUS1').buffer);
    for (let i = 0; i < words.length - 6; i++) {
      if (magic.every((value, j) => words[i + j] === value) && words[i + 4] === dailySeed(today())) {
        heap[i * 4 + 20] = 3; heap[i * 4 + 21] = 1;
        return;
      }
    }
    throw new Error('Live status block not found');
  });
  await page.waitForFunction(() => document.querySelector('.app').dataset.state === 'title');
  assert.equal(await page.locator('#play').isVisible(), false);
  const stats = await page.evaluate(() => JSON.parse(localStorage.getItem('dailyred-stats')));
  assert.deepEqual([stats.wins, stats.losses, stats.dayStreak, stats.winStreak, stats.lastRevision], [8, 3, 8, 4, 1]);
  await page.reload(); assert.equal(await page.locator('#play').isVisible(), false);
  await page.clock.setFixedTime(new Date('2026-10-18T10:00:00-03:00'));
  await page.reload(); assert(await page.locator('#play').isVisible());
  await page.evaluate(value => localStorage.setItem('dailyred-stats', JSON.stringify({ ...value, lastPlayed: '2026-10-16' })), legacy);
  await page.clock.setFixedTime(new Date('2026-10-16T10:00:00-03:00'));
  await page.reload(); assert.equal(await page.locator('#play').isVisible(), false);
  console.log(`PASS ${url}: Oct 17 reopens for legacy players, stats retained, real emulator finishes, new result relocks across reload, other dates unchanged`);
} finally { await browser.close(); server?.close(); }
