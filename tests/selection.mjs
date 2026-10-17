import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const language = process.argv[2] || 'es';
assert(['es', 'en'].includes(language));
if (language === 'es') process.env.DAILYRED_GAME_DIR = fileURLToPath(new URL('../.toolchain/pokefirered-es', import.meta.url));
const { startServer, launchBrowser, waitFor } = await import('./lib.mjs');
const { readParty } = await import('./party.mjs');
const { validateTypeRules } = await import('./type-rules.mjs');
const { dailySeed } = await import('../web/daily.js');
const out = 'tests/output/team-modes';
mkdirSync(out, { recursive: true });
const server = await startServer(), browser = await launchBrowser();
try {
  for (const lang of [language]) {
    const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-10-16T23:59:50'));
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${server.url}/?lang=${lang}`);
    const before = await page.evaluate(() => localStorage.getItem('dailyred-stats'));
    let downloads = 0;
    page.on('request', req => { if (/\.gba\.gz/.test(req.url())) downloads++; });
    await page.click('#play');
    assert.equal(await page.locator('#choice-heading').textContent(), lang === 'es' ? '¿Cómo querés jugar?' : 'How do you want to play?');
    assert.equal(await page.locator('[name=teamMode]').count(), 7);
    assert.equal(await page.locator('[name=teamMode]:checked').inputValue(), 'random');
    assert.equal(downloads, 0, 'choosing does not download or start a game');
    await page.check('[value=fire]');
    await page.screenshot({ path: `${out}/selection-${lang}-desktop.png`, fullPage: true });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#play').isVisible(), true);
    assert.equal(await page.evaluate(() => localStorage.getItem('dailyred-stats')), before);
    await page.click('#play');
    assert.equal(await page.locator('[name=teamMode]:checked').inputValue(), 'random');
    await page.check('[value=water]');
    await page.clock.setFixedTime(new Date('2026-10-17T00:00:10'));
    // A blocked download must retain the choice on retry and consume no attempt.
    const romPattern = `**/game/dailyred${lang === 'es' ? '-es' : ''}.gba.gz`;
    await page.route(romPattern, route => route.fulfill({ status: 503, body: 'retry' }));
    await page.click('#begin');
    await page.waitForFunction(() => document.querySelector('.app').dataset.state === 'error');
    assert.equal(await page.evaluate(() => localStorage.getItem('dailyred-stats')), before);
    await page.unroute(romPattern);
    await page.click('#retry');
    await page.waitForFunction(() => window.dailyRed.emulator, null, { timeout: 60000 });
    await page.evaluate(() => { window.emu = window.dailyRed.emulator; });
    const { mem } = await waitFor(page, s => s.inOverworld, { timeoutMs: 60000 });
    assert.deepEqual(validateTypeRules(readParty(mem), 'water'), []);
    const ewram = mem.read(0x02000000, 0x40000);
    const status = ewram.indexOf('DAILYRED-STATUS1', 0, 'latin1');
    assert(status >= 0);
    assert.equal(ewram.readUInt32LE(status + 16), dailySeed('2026-10-17'), 'midnight during selection uses the new day');
    await page.screenshot({ path: `${out}/water-${lang}-playing.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await context.close();

    for (const width of [320, 390]) {
      const mobile = await browser.newContext({ serviceWorkers: 'block', viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
      const phone = await mobile.newPage(); await phone.goto(`${server.url}/?lang=${lang}`);
      await phone.locator('#play').tap();
      for (const mode of ['random', 'fire', 'water', 'grass', 'fighting', 'electric', 'rock']) {
        await phone.locator(`[value=${mode}]`).check();
        assert.equal(await phone.locator('[name=teamMode]:checked').inputValue(), mode);
      }
      assert(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      for (const option of await phone.locator('.team-option, .choice-actions .button').all()) {
        const box = await option.boundingBox(); assert(box.height >= 44 && box.width >= 44);
      }
      await phone.screenshot({ path: `${out}/selection-${lang}-${width}.png`, fullPage: true });
      await phone.locator('#choice-back').tap();
      assert(await phone.locator('#play').isVisible());
      await mobile.close();
    }
    // A result arriving in another tab during selection locks every mode.
    const locked = await browser.newPage();
    await locked.goto(`${server.url}/?lang=${lang}`); await locked.click('#play');
    await locked.check('[value=electric]');
    await locked.evaluate(async () => {
      const { today } = await import('/daily.js');
      localStorage.setItem('dailyred-stats', JSON.stringify({ wins: 7, losses: 3, lastPlayed: today(), lastResult: 'won', winStreak: 2, dayStreak: 5 }));
    });
    await locked.click('#begin');
    await locked.waitForFunction(() => document.querySelector('.app').dataset.state === 'title');
    assert.equal(await locked.locator('#play').isVisible(), false);
    assert.equal(await locked.locator('#stat-wins').textContent(), '7');
    assert.equal(await locked.locator('#stat-losses').textContent(), '3');
    await locked.reload(); assert.equal(await locked.locator('#play').isVisible(), false);
    await locked.close();
    console.log(`PASS ${lang}: seven choices, cancel, defaults, midnight, retry retains Water in real ROM, shared lock/old stats, desktop/320/390 layouts`);
  }
} finally { await browser.close(); server.close(); }
