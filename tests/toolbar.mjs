// Focused UI regression with the real emulator. Simulate its end-of-game
// signal in RAM to exercise teardown without replaying an entire battle.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
process.env.DAILYRED_GAME_DIR = fileURLToPath(new URL('../.toolchain/pokefirered-es', import.meta.url));
const { startServer, launchBrowser, waitFor, sleep } = await import('./lib.mjs');
const server = await startServer(), browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'es-AR' });
  await page.addInitScript(() => {
    window.testAudioContexts = [];
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(...args) { super(...args); window.testAudioContexts.push(this); }
    };
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${server.url}/?lang=es`);
  await page.locator('#play').tap(); await page.locator('#begin').tap();
  await page.waitForFunction(() => window.dailyRed?.emulator, null, { timeout: 60000 });
  await page.evaluate(() => { window.emu = window.dailyRed.emulator; });
  await waitFor(page, state => state.inOverworld, { timeoutMs: 30000 });
  await sleep(1800);
  await page.locator('#fullscreen').tap();
  await page.waitForFunction(() => document.fullscreenElement);
  await page.locator('#sound').tap();
  assert.equal(await page.locator('#sound').getAttribute('aria-pressed'), 'true');
  await page.locator('#sound').tap();
  assert.equal(await page.locator('#sound').getAttribute('aria-pressed'), 'false');
  await page.waitForFunction(async () => {
    const { dailySeed, today } = await import('/daily.js');
    const heap = window.dailyRed.emulator.getEmscriptenModule().HEAPU8;
    const words = new Uint32Array(heap.buffer, heap.byteOffset, heap.byteLength >>> 2);
    const magic = new Uint32Array(new TextEncoder().encode('DAILYRED-STATUS1').buffer);
    for (let i = 0; i < words.length - 6; i++) {
      if (magic.every((word, j) => words[i + j] === word) && words[i + 4] === dailySeed(today())) {
        heap[i * 4 + 20] = 3; // PHASE.FINISHED
        heap[i * 4 + 21] = 2; // RESULT.LOST
        return true;
      }
    }
    return false;
  });
  await page.waitForFunction(() => document.querySelector('.app').dataset.state === 'title' && !window.dailyRed.emulator);
  const controls = { soundEnabled: await page.locator('#sound').isEnabled(), fullscreenEnabled: await page.locator('#fullscreen').isEnabled() };
  console.log('After teardown:', controls);
  assert.deepEqual(controls, { soundEnabled: true, fullscreenEnabled: true });
  await page.waitForFunction(() => window.testAudioContexts.length > 0 && window.testAudioContexts.every(ctx => ctx.state === 'closed'));
  await page.locator('#sound').tap();
  assert.equal(await page.locator('#sound').getAttribute('aria-label'), 'Activar sonido');
  assert.equal((await page.locator('#sound').textContent()).trim(), '');
  assert.equal(await page.locator('#sound .sound-off').isVisible(), true);
  await page.locator('#sound').tap();
  assert.equal(await page.locator('#sound').getAttribute('aria-label'), 'Silenciar');
  assert.equal(await page.locator('#sound .sound-on').isVisible(), true);
  mkdirSync('output/playwright/toolbar', { recursive: true });
  await page.screenshot({ path: 'output/playwright/toolbar/finished-fullscreen.png' });
  await page.locator('#fullscreen').tap();
  await page.waitForFunction(() => !document.fullscreenElement);
  assert.equal(await page.locator('#play').isVisible(), false);
  assert.deepEqual(errors, []);
  console.log('PASS: fullscreen exits after game teardown; sound icons toggle before/after finish; audio contexts close; daily lock remains.');
} finally { await browser.close(); server.close(); }
