// Visible practice run: normal buttons only; no RAM writes or forced results.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, findChrome, waitFor, sleep, press, getStatus, startRedBattle, symbol } from './lib.mjs';
import { readParty, validateTeam, formatMon } from './party.mjs';

const out = join(ROOT, 'output/playwright');
mkdirSync(out, { recursive: true });
const context = await chromium.launchPersistentContext(join(ROOT, '.toolchain/chrome-profile'), {
  executablePath: findChrome(), headless: false, viewport: { width: 1280, height: 900 },
  args: ['--no-first-run', '--no-default-browser-check', `--disk-cache-dir=${join(ROOT, '.toolchain/cache/chrome')}`],
});
try {
  const page = context.pages()[0] || await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://localhost:8080/?seed=42&lang=en');
  const statsBefore = await page.evaluate(() => localStorage.getItem('dailyred-stats'));
  await page.locator('#play').click();
  await page.waitForFunction(() => window.dailyRed?.emulator, null, { timeout: 60000 });
  await page.evaluate(() => { window.emu = window.dailyRed.emulator; });
  const initial = await waitFor(page, (s) => s.inOverworld, { timeoutMs: 30000 });
  const team = readParty(initial.mem);
  const problems = validateTeam(team);
  if (problems.length) throw new Error(problems.join('; '));
  await sleep(1000);
  await page.screenshot({ path: join(out, 'windows-overworld.png') });
  await press(page, 'start'); await sleep(800);
  await press(page, 'a'); await sleep(2000);
  await page.screenshot({ path: join(out, 'windows-party.png') });
  for (let i = 0; i < 3; i++) { await press(page, 'b'); await sleep(700); }
  await waitFor(page, (s) => s.inOverworld);
  await startRedBattle(page);
  await page.screenshot({ path: join(out, 'windows-red-battle.png') });
  const before = await getStatus(page);
  const battleData = (s) => [...s.mem.read(symbol('gBattleMons'), 0xB0)];
  const activeMons = (s) => [0, 1].map((i) => {
    const mon = s.mem.read(symbol('gBattleMons') + i * 0x58, 0x58);
    return { hp: mon.readUInt16LE(0x28), pp: [...mon.subarray(0x24, 0x28)] };
  });
  // Choose FIGHT and the first move, then let the original engine resolve a turn.
  await press(page, 'a'); await sleep(700); await press(page, 'a');
  await sleep(12000);
  await page.screenshot({ path: join(out, 'windows-turn.png') });
  const after = await getStatus(page);
  const changed = JSON.stringify(battleData(before)) !== JSON.stringify(battleData(after));
  if (!changed) throw new Error('No battle data changed after selecting an attack.');
  const stats = await page.evaluate(() => localStorage.getItem('dailyred-stats'));
  if (stats !== statsBefore) throw new Error('Practice changed daily stats.');
  if (errors.length) throw new Error(errors.join('; '));
  const report = { seed: 42, team: team.party.map(formatMon), battleStarted: before.inBattle,
    turnChangedBattleData: changed, before: activeMons(before), after: activeMons(after),
    dailyStatsUnchanged: stats === statsBefore, dailyStats: stats, pageErrors: errors };
  writeFileSync(join(out, 'windows-verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes('--close')) {
    console.log('VERIFIED. Cerrando el navegador de verificación.');
    await context.close();
  } else {
    console.log('VERIFIED. La batalla queda abierta; cerrá Chrome cuando termines.');
    await new Promise((done) => context.once('close', done));
  }
} catch (error) {
  await context.close();
  throw error;
}
