// Independent checks using FireRed's data, not the generator's eligibility code.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GAME_DIR } from './lib.mjs';
import { SPECIES, MOVES, learnableMoves, baseStatTotal, isLegendary } from './party.mjs';

export const MODES = { random: null, fire: 'FIRE', water: 'WATER', grass: 'GRASS', fighting: 'FIGHTING', electric: 'ELECTRIC', rock: 'ROCK' };
const data = file => readFileSync(join(GAME_DIR, file), 'utf8');
const speciesIds = new Map([...SPECIES].map(([id, name]) => [name, id]));
export const speciesTypes = new Map([...data('src/data/pokemon/species_info.h').matchAll(/\[SPECIES_(\w+)\]\s*=\s*\{\s*\n([\s\S]*?)\n    \}/g)].map(m => [speciesIds.get(m[1]), [...m[2].matchAll(/TYPE_(\w+)/g)].slice(0, 2).map(x => x[1])]));
const moveIds = new Map([...MOVES].map(([id, name]) => [name, id]));
export const moveInfo = new Map([...data('src/data/battle_moves.h').matchAll(/\[MOVE_(\w+)\]\s*=\s*\{([^}]*)\}/g)].map(m => [moveIds.get(m[1]), { power: Number(m[2].match(/\.power = (\d+)/)?.[1] ?? 0), type: m[2].match(/\.type = TYPE_(\w+)/)?.[1], name: m[1] }]));
// Variable/typeless Gen 3 attacks and moves requiring sleep or Stockpile cannot fill the guaranteed slots.
const special = new Set(['HIDDEN_POWER', 'WEATHER_BALL', 'STRUGGLE', 'SNORE', 'DREAM_EATER', 'SPIT_UP', 'FUTURE_SIGHT', 'DOOM_DESIRE', 'BEAT_UP', 'BIDE']);
export function qualifyingMoves(species, mode = 'random') {
  const types = MODES[mode] ? [MODES[mode]] : speciesTypes.get(species);
  return [...learnableMoves(species)].filter(id => {
    const move = moveInfo.get(id);
    return move?.power > 0 && types?.includes(move.type) && !special.has(move.name);
  });
}
export function auditPools() {
  for (const [mode, type] of Object.entries(MODES)) {
    const pool = [...SPECIES].filter(([id]) => id >= 1 && id <= 411 && !(id >= 252 && id <= 276)
      && (!type || speciesTypes.get(id)?.includes(type)) && qualifyingMoves(id, mode).length >= 2);
    const regular = pool.filter(([, speciesName]) => !isLegendary({ speciesName }));
    const legendary = pool.filter(([, speciesName]) => isLegendary({ speciesName }));
    const best = regular.map(([id]) => baseStatTotal(id)).sort((a, b) => b - a).slice(0, 6).reduce((a, b) => a + b, 0);
    console.log(`${mode}: ${regular.length} regular, ${legendary.length} legendary; best non-legendary BST ${best}`);
    if (regular.length < 6 || best < 2700) throw new Error(`Insufficient pool: ${mode}`);
    const bestFive = regular.map(([id]) => baseStatTotal(id)).sort((a, b) => b - a).slice(0, 5).reduce((a, b) => a + b, 0);
    for (const [id] of legendary) if (bestFive + baseStatTotal(id) < 2700) throw new Error(`Impossible legendary team: ${mode}/${SPECIES.get(id)}`);
  }
}
export function validateTypeRules({ party }, mode = 'random') {
  const problems = [];
  for (const mon of party.filter(Boolean)) {
    if (MODES[mode] && !speciesTypes.get(mon.species)?.includes(MODES[mode])) problems.push(`${mon.speciesName}: wrong type for ${mode}`);
    const qualifying = new Set(qualifyingMoves(mon.species, mode));
    if (new Set(mon.moves.filter(id => qualifying.has(id))).size < 2) problems.push(`${mon.speciesName}: fewer than two legal same-type attacks for ${mode}`);
  }
  return problems;
}
if (process.argv.includes('--audit')) auditPools();
