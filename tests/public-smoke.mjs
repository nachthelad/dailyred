// Smoke test against an actual public tunnel, using installed Chrome.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const root = resolve(import.meta.dirname, '..');
process.env.DAILYRED_GAME_DIR = join(root, '.toolchain/pokefirered-es');
const { launchBrowser, waitFor, sleep, startRedBattle, press, getStatus } = await import('./lib.mjs');
const { readParty, validateTeam } = await import('./party.mjs');
const base = process.argv[2] || JSON.parse(readFileSync(join(root, '.toolchain/public-server.json'))).url;
const url = new URL('/?seed=42&lang=es', base).href;
const output = join(root, 'output/playwright/public');
mkdirSync(output, { recursive: true });
const browser = await launchBrowser();
try {
  const context = await browser.newContext({ locale: 'es-AR', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(url, { timeout: 60000 });
  assert.equal(response.status(), 200);
  assert.equal(await page.locator('html').getAttribute('lang'), 'es');
  assert.ok((await page.locator('.footer').innerText()).includes('nachthelad.com.ar'));
  await page.locator('#play').tap();
  await page.waitForFunction(() => window.dailyRed?.emulator, null, { timeout: 90000 });
  await page.evaluate(() => { window.emu = window.dailyRed.emulator; });
  const state = await waitFor(page, (s) => s.inOverworld, { timeoutMs: 30000 });
  assert.equal(validateTeam(readParty(state.mem)).length, 0);
  await sleep(1800);
  assert.equal(await page.locator('.pad').isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  // Hold for multiple emulated frames; an instantaneous synthetic tap may
  // press and release between two GBA input polls.
  const cdp = await context.newCDPSession(page);
  async function touchButton(button) {
    const control = page.locator(`.pad [data-button="${button}"]`);
    await control.scrollIntoViewIfNeeded();
    const box = await control.boundingBox();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
    await sleep(150);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await touchButton('start');
  await sleep(1000);
  // The start menu retains CB2_Overworld. Enter the party to observe the
  // actual callback transition instead of mistaking that menu for a failure.
  await touchButton('a');
  await sleep(1800);
  assert.equal((await getStatus(page)).inOverworld, false);
  await touchButton('b');
  await sleep(1400);
  await touchButton('b');
  await sleep(1000);
  await waitFor(page, (s) => s.inOverworld);
  await page.screenshot({ path: join(output, 'mobile.png') });
  await startRedBattle(page);
  assert.equal((await getStatus(page)).inBattle, true);
  await press(page, 'a'); await sleep(500); await press(page, 'a'); await sleep(8000);
  await page.screenshot({ path: join(output, 'red-battle.png') });
  assert.deepEqual(errors, []);
  const result = { url, verifiedAt: new Date().toISOString(), mobileViewport: '390x844', language: 'es', validTeam: true, touchMenu: true, redBattle: true, javascriptErrors: errors, physicalPhone: 'pending user verification' };
  writeFileSync(join(output, 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); }
