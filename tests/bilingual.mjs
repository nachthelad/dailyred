// Real ROM/browser coverage. Run once per language; symbols come from that ELF.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
const language = process.argv[2] || 'es';
assert.ok(['en', 'es'].includes(language));
const root = resolve(import.meta.dirname, '..');
process.env.DAILYRED_GAME_DIR = join(root, language === 'es' ? '.toolchain/pokefirered-es' : 'pokefirered');
process.env.DAILYRED_ROM_LANGUAGE = language;
const { startServer, launchBrowser, sleep, press, getStatus, waitFor, startRedBattle, symbol } = await import('./lib.mjs');
const { readParty, validateTeam } = await import('./party.mjs');
const out = join(root, `tests/output/bilingual-${language}`);
mkdirSync(out, { recursive: true });
const server = await startServer();
const browser = await launchBrowser({ headless: !process.argv.includes('--headed') });
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); console.log('PASS', message); checks++; };
const locale = language === 'es' ? 'es-AR' : 'en-US';
const other = language === 'es' ? 'en' : 'es';
try {
  const context = await browser.newContext({ locale, viewport: { width: 1280, height: 980 } });
  const page = await context.newPage();
  const errors = [], romRequests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => { if (/\.gba\.gz/.test(r.url())) romRequests.push(r.url()); });
  await page.goto(`${server.url}/?seed=42`);
  check(await page.locator('html').getAttribute('lang') === language, 'browser language selects the initial UI');
  const text = (lang) => lang === 'es' ? 'Jugar' : 'Play';
  check(await page.locator('#play').textContent() === text(language), 'Play label is translated');
  await page.locator(`[data-language="${other}"]`).click();
  check(await page.locator('#play').textContent() === text(other), 'selector updates UI immediately');
  await page.locator(`[data-language="${language}"]`).click();
  await page.reload();
  check(await page.locator(`[data-language="${language}"]`).getAttribute('aria-pressed') === 'true', 'language choice survives a reload');
  check(await page.locator('.footer').innerText().then((s) => s.includes('amoi-builds') && s.includes('nachthelad') && s.includes('nachthelad.com.ar')), 'original creator and requested adaptation credit are visible');
  check(await page.locator('.footer a[href="https://nachthelad.com.ar"]').count() === 1, 'adaptation links to nachthelad.com.ar');
  await page.screenshot({ path: join(out, 'title.png'), fullPage: true });
  const beforeStats = await page.evaluate(() => localStorage.getItem('dailyred-stats'));
  await page.click('#play');
  await page.waitForFunction(() => window.dailyRed?.emulator, null, { timeout: 60000 });
  await page.evaluate(() => { window.emu = window.dailyRed.emulator; });
  const initial = await waitFor(page, (s) => s.inOverworld, { timeoutMs: 30000 });
  const team = readParty(initial.mem);
  check(validateTeam(team).length === 0, 'real ROM generates six valid level 100 Pokémon');
  check(await page.locator(`[data-language="${language}"]`).isDisabled(), 'selector is disabled while a game is running');
  check(await page.evaluate((other) => { document.querySelector(`[data-language="${other}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })); return document.documentElement.lang; }, other) === language, 'programmatic changes cannot restart or switch an active run');
  const suffix = language === 'es' ? '/game/dailyred-es.gba.gz' : '/game/dailyred.gba.gz';
  check(romRequests.length === 1 && romRequests[0].endsWith(suffix), 'only the selected language ROM is downloaded');
  const rom = gunzipSync(readFileSync(join(root, 'web', suffix.slice(1))));
  const charmap = readFileSync(join(root, 'pokefirered/charmap.txt'), 'utf8');
  const glyph = new Map([...charmap.matchAll(/^'(.)'\s*=\s*([0-9A-F]{2})/gm)].map((m) => [m[1], parseInt(m[2], 16)]));
  const encoded = (str) => Buffer.from([...str].map((ch) => glyph.get(ch)));
  const names = symbol('gMoveNames') - 0x08000000;
  const move = language === 'es' ? 'TERREMOTO' : 'EARTHQUAKE';
  check(rom.subarray(names + 89 * 13, names + 89 * 13 + move.length).equals(encoded(move)), 'Earthquake is stored in the selected language inside the ROM');
  const palette = readFileSync(join(root, 'pokefirered/graphics/summary_screen/bg.gbapal'));
  const paletteAt = symbol('gSummaryScreen_Bg_Pal') - 0x08000000;
  check(palette.length === 224 && rom.subarray(paletteAt, paletteAt + palette.length).equals(palette), 'summary preserves all seven original palette banks');
  await sleep(1800); // The overworld callback is installed before the entry fade finishes.
  await press(page, 'start'); await sleep(800); await press(page, 'a'); await sleep(1600);
  check(!(await getStatus(page)).inOverworld, 'party menu really opened before taking its screenshot');
  await page.screenshot({ path: join(out, 'party.png') });
  await press(page, 'a'); await sleep(600); await press(page, 'a'); await sleep(1400);
  const summary = await getStatus(page);
  check((summary.mem.read(symbol('gMain') + 4, 4).readUInt32LE() & ~1) === symbol('CB2_RunPokemonSummaryScreen'), 'Pokémon summary really opened');
  await page.screenshot({ path: join(out, 'summary-info.png') });
  await press(page, 'right'); await sleep(600);
  await page.screenshot({ path: join(out, 'summary-stats.png') });
  await press(page, 'right'); await sleep(600);
  await page.screenshot({ path: join(out, 'summary-moves.png') });
  await press(page, 'a'); await sleep(800);
  await page.screenshot({ path: join(out, 'move-description.png') });
  for (let i = 0; i < 8; i++) { await press(page, 'b'); await sleep(1000); }
  await sleep(1500);
  await waitFor(page, (s) => s.inOverworld);
  await startRedBattle(page);
  check((await getStatus(page)).inBattle, 'normal controls initiate the real RED battle');
  await page.screenshot({ path: join(out, 'red-battle.png') });
  await press(page, 'a'); await sleep(500); await press(page, 'a'); await sleep(10000);
  await page.screenshot({ path: join(out, 'turn.png') });
  check(await page.evaluate(() => localStorage.getItem('dailyred-stats')) === beforeStats, 'practice does not change daily statistics');
  check(errors.length === 0, 'no JavaScript errors during the real game');
  const result = { language, seed: 42, checks, team: team.party.map(({ species, moves, level, stats, ivs, evs }) => ({ species, moves, level, stats, ivs, evs })) };
  const report = join(out, 'result.json');
  writeFileSync(report, JSON.stringify(result, null, 2));
  const otherReport = join(root, `tests/output/bilingual-${other}/result.json`);
  if (existsSync(otherReport)) check(JSON.stringify(JSON.parse(readFileSync(otherReport)).team) === JSON.stringify(result.team), 'same seed produces identical species, moves and stats in EN and ES');
  await context.close();

  if (language === 'es') {
    const helpContext = await browser.newContext({ locale, viewport: { width: 1280, height: 980 } });
    const helpPage = await helpContext.newPage();
    await helpPage.goto(`${server.url}/?seed=42`); await helpPage.click('#play');
    await helpPage.waitForFunction(() => window.dailyRed?.emulator, null, { timeout: 60000 });
    await helpPage.evaluate(() => { window.emu = window.dailyRed.emulator; });
    await waitFor(helpPage, (s) => s.inOverworld, { timeoutMs: 30000 });
    await sleep(1800); await press(helpPage, 'r'); await sleep(1200);
    const helpState = await getStatus(helpPage);
    const items = helpState.mem.read(symbol('gHelpSystemListMenu') + 4, 2).readUInt16LE();
    check(helpState.mem.read(symbol('gHelpSystemEnabled'), 1)[0] === 0 && items === 0 && helpState.inOverworld,
      'legacy campaign help remains disabled, as in the original Daily Red');
    await helpContext.close();
  }

  const daily = await browser.newContext({ locale });
  const locked = await daily.newPage();
  await locked.goto(server.url);
  await locked.evaluate(async () => {
    const m = await import('/daily.js'); const stats = m.loadStats(); const day = m.today();
    m.markBattleStarted(stats, day); m.recordResult(stats, day, true);
  });
  await locked.reload();
  const saved = await locked.evaluate(() => localStorage.getItem('dailyred-stats'));
  check(!(await locked.locator('#play').isVisible()), 'daily challenge remains locked after a recorded battle');
  await locked.locator(`[data-language="${other}"]`).click();
  check(!(await locked.locator('#play').isVisible()), 'changing language does not grant another daily attempt');
  check(await locked.evaluate(() => localStorage.getItem('dailyred-stats')) === saved, 'language change preserves daily records');
  await daily.close();

  const phone = await browser.newContext({ locale, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobile = await phone.newPage(); await mobile.goto(server.url);
  check(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'selector and translated labels do not cause mobile horizontal overflow');
  await mobile.screenshot({ path: join(out, 'mobile.png'), fullPage: true });
  await phone.close();
  if (language === 'es') {
    const failure = await browser.newContext({ locale }); const bad = await failure.newPage();
    const requests = []; bad.on('request', (r) => requests.push(r.url()));
    await bad.route('**/game/dailyred-es.gba.gz', (route) => route.fulfill({ status: 404, body: 'missing' }));
    await bad.goto(`${server.url}/?seed=42`); await bad.click('#play');
    await bad.waitForFunction(() => document.querySelector('.app').dataset.state === 'error');
    check((await bad.locator('#error-text').textContent()).includes('No se pudo descargar'), 'Spanish download error is translated');
    check(!requests.some((r) => r.endsWith('/game/dailyred.gba.gz')), 'missing Spanish ROM never silently falls back to English');
    await failure.close();
  }
  console.log(`All ${checks} bilingual ${language} checks passed`);
} finally { await browser.close(); server.close(); }
