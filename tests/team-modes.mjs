import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { startServer, launchBrowser, bootGame, waitFor, symbol } from './lib.mjs';
import { readParty, validateTeam, isLegendary } from './party.mjs';
import { MODES, auditPools, validateTypeRules, qualifyingMoves, speciesTypes } from './type-rules.mjs';
import { injectConfig, findConfigOffset } from '../web/rom-config.js';

auditPools();
mkdirSync('tests/output/team-modes', { recursive: true });
const rom = new Uint8Array(gunzipSync(readFileSync(`web/game/dailyred${process.env.DAILYRED_ROM_LANGUAGE === 'es' ? '-es' : ''}.gba.gz`)));
assert(findConfigOffset(rom) >= 0);
assert.throws(() => injectConfig(rom, { seed: 42, teamMode: 'dragon' }), /Unknown team mode/);
assert.throws(() => injectConfig(new TextEncoder().encode('DAILYRED-CONF-V2'), { seed: 42 }), /Rebuild/);
const original = rom.slice();
const configured = injectConfig(rom, { seed: 42, teamMode: 'water', daily: true, wins: 7, battles: 10 });
const offset = findConfigOffset(configured);
assert.equal(configured[offset + 9], 2);
assert.deepEqual(rom, original);

const server = await startServer();
const browser = await launchBrowser();
try {
  const seeds = process.argv.includes('--legendary') ? [14] : [1, 14, 42, 31337];
  const queue = Object.keys(MODES).flatMap(teamMode => seeds.map(seed => ({ teamMode, seed })));
  const keys = new Map();
  async function generate(page, teamMode, seed) {
    await bootGame(page, server.url, { seed, teamMode });
    const { mem } = await waitFor(page, s => s.inOverworld, { timeoutMs: 60000, what: `${teamMode}/${seed}` });
    const team = readParty(mem);
    assert.deepEqual([...validateTeam(team), ...validateTypeRules(team, teamMode)], [], `${teamMode}/${seed}`);
    const eligible = mem.read(symbol('sEligible'), 412);
    for (let id = 1; id <= 411; id++) {
      const realSpecies = !(id >= 252 && id <= 276);
      const expected = realSpecies && (!MODES[teamMode] || speciesTypes.get(id)?.includes(MODES[teamMode])) && qualifyingMoves(id, teamMode).length >= 2;
      assert.equal(Boolean(eligible[id]), Boolean(expected), `ROM eligibility ${teamMode}/${id}`);
    }
    const legendaryRoll = (((Math.imul(seed, 1103515245) + 24691) >>> 16) % 8) === 0;
    assert.equal(team.party.some(isLegendary), teamMode !== 'fighting' && legendaryRoll, `${teamMode}/${seed}: legendary roll retained`);
    // Compare every randomized battle attribute, independently of ownership metadata.
    const key = JSON.stringify(team.party.map(({ species, moves, ivs, evs, nature, abilityNum, heldItem, stats, shiny }) => ({ species, moves, ivs, evs, nature, abilityNum, heldItem, stats, shiny })));
    console.log(`PASS ${teamMode}/${seed}: ${team.party.map(m => m.speciesName).join(', ')}`);
    return key;
  }
  await Promise.all(Array.from({ length: 3 }, async () => {
    const page = await browser.newPage();
    try {
      while (queue.length) {
        const { teamMode, seed } = queue.shift();
        keys.set(`${teamMode}/${seed}`, await generate(page, teamMode, seed));
      }
    } finally { await page.close(); }
  }));
  const page = await browser.newPage();
  const repeatSeed = seeds.includes(42) ? 42 : seeds[0];
  for (const mode of Object.keys(MODES)) assert.equal(await generate(page, mode, repeatSeed), keys.get(`${mode}/${repeatSeed}`), `deterministic ${mode}`);
  // Pool feasibility is exhaustively audited above; ROM boots exercise the normal path.
  await page.screenshot({ path: 'tests/output/team-modes/rom-overworld.png' });
  console.log(`PASS all seven modes, ${seeds.length} seeds each, full battle-attribute determinism, legal attacks, legendary rolls, configuration versioning`);
} finally { await browser.close(); server.close(); }
