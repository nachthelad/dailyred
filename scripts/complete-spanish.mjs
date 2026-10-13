// Complete and constrain the imported text catalog. Run after import-spanish.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { entries, namedPattern } from './import-spanish.mjs';
import { wrap, pixelWidth } from './rom-text.mjs';
const root = resolve(import.meta.dirname, '..');
const dir = join(root, '.toolchain/downloads/es-source');
const catalogPath = join(root, 'localization/es/catalog.json');
const catalog = JSON.parse(readFileSync(catalogPath));
const overrides = JSON.parse(readFileSync(join(root, 'localization/es/overrides.json')));
const original = (file) => readFileSync(join(root, 'pokefirered', file), 'utf8');
const cText = (text) => text.replace(/"/g, '\\"').replace(/\n/g, '\\n');
function named(file, translations) {
  const source = entries(original(file), namedPattern);
  for (const [key, text] of Object.entries(translations)) {
    if (!source.has(key)) throw new Error(`Unknown symbol ${file}:${key}`);
    catalog[file][key] = { from: source.get(key), to: cText(text) };
  }
}
function csv(text) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (ch === ',' || ch === '\n')) {
      row.push(value.replace(/\r$/, '')); value = '';
      if (ch === '\n') { rows.push(row); row = []; }
    } else value += ch;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}
const flavors = csv(readFileSync(join(dir, 'move_flavor_text.csv'), 'utf8'));
const chosen = new Map(), groups = {};
// Prefer Gen 3 if present. The available Spanish data starts at X/Y; overrides
// below remove later-generation changes and shorten text for the GBA window.
for (const [id, group, language, text] of flavors.slice(1)) {
  if (language !== '7' || +id > 354) continue;
  groups[group] = (groups[group] || 0) + 1;
  const rank = group === '7' ? 0 : group === '6' ? 1 : group === '5' ? 2 : 100 + +group;
  if (!chosen.has(+id) || rank < chosen.get(+id).rank) chosen.set(+id, { text, rank, group });
}
const constants = new Map([...original('include/constants/moves.h').matchAll(/^#define (MOVE_\w+)\s+(\d+)/gm)].map((m) => [m[1], +m[2]]));
const desc = original('src/move_descriptions.c');
const descriptions = {};
for (const [, move, symbol] of desc.matchAll(/\[(MOVE_\w+)\s*-\s*1\]\s*=\s*(gMoveDescription_\w+)/g)) {
  const flavor = chosen.get(constants.get(move));
  if (!flavor) throw new Error(`No Spanish description for ${move}`);
  // Preserve the original four-line summary window, wrapping the supplied text.
  const shortName = symbol.replace('gMoveDescription_', '');
  const text = overrides.descriptions[shortName] || flavor.text.replace(/[\n\f\r]+/g, ' ').replace(/POKéMON/g, 'Pokémon');
  descriptions[symbol] = wrap(text).join('\n');
}
named('src/move_descriptions.c', descriptions);
console.log('Descriptions:', Object.keys(descriptions).length, 'available language groups:', groups);
const tooLong = Object.entries(descriptions).filter(([, v]) => v.split('\n').length > 4);
writeFileSync(join(dir, 'long-descriptions.json'), JSON.stringify(Object.fromEntries(tooLong), null, 2));
named('src/strings.c', overrides.strings);

named('src/battle_message.c', {
  sText_DontBeAThief: '¡No robes!\n¡No puedes atrapar Pokémon ajenos!',
  sText_FoePkmnPrefix: 'Rival ', sText_FoePkmnPrefix2: 'Rival ', sText_FoePkmnPrefix3: 'Rival ',
  sText_WildPkmnPrefix: 'Salvaje ', sText_FoePkmnPrefix4: 'Rival ',
  sText_EnemyAboutToSwitchPkmn: '{B_TRAINER1_CLASS} {B_TRAINER1_NAME}\nenviará a {B_BUFF2}.\n¿Quieres cambiar de Pokémon,\n{B_PLAYER_NAME}?',
  sText_PkmnLoafing: '¡{B_ATK_NAME_WITH_PREFIX}\nholgazanea!',
});
// These unused legacy strings contain tokens added only by the external fork.
delete catalog['src/strings.c'].gText_YaySmileEmoji;
delete catalog['src/strings.c'].gText_10P30P50P50P;

const itemNames = {
  ITEM_BURN_HEAL: 'ANTIQUEMAR', ITEM_ICE_HEAL: 'ANTIHIELO', ITEM_MAX_REVIVE: 'REVIVIR MÁX.',
  ITEM_HEAL_POWDER: 'POLVO CURA', ITEM_REVIVAL_HERB: 'HIERBA REV.', ITEM_YELLOW_FLUTE: 'FLAUTA AMAR.',
  ITEM_SACRED_ASH: 'CENIZA SAGR.', ITEM_SHOAL_SHELL: 'CONCHA CARD.', ITEM_YELLOW_SHARD: 'TROZO AMAR.',
  ITEM_RARE_CANDY: 'CARAMELO RARO', ITEM_X_SPECIAL: 'ESPECIAL X', ITEM_SUPER_REPEL: 'SUPERREPEL.',
  ITEM_MAX_REPEL: 'MÁX. REPEL.', ITEM_STAR_PIECE: 'TROZO ESTRE.', ITEM_HEART_SCALE: 'ESCAMA COR.',
  ITEM_GLITTER_MAIL: 'CARTA BRILLO', ITEM_MECH_MAIL: 'CARTA MECÁN.', ITEM_TROPIC_MAIL: 'CARTA TROPIC.',
  ITEM_FAB_MAIL: 'CARTA FABUL.', ITEM_SOOTHE_BELL: 'CAMP. ALIVIO', ITEM_CHOICE_BAND: 'CINTA ELEGIDA',
  ITEM_SILVER_POWDER: 'POLVO PLATA', ITEM_AMULET_COIN: 'MON. AMULETO', ITEM_DEEP_SEA_TOOTH: 'DIENTE MAR.',
  ITEM_DEEP_SEA_SCALE: 'ESCAMA MAR.', ITEM_DRAGON_SCALE: 'ESCAMA DRAG.', ITEM_MIRACLE_SEED: 'SEM. MILAGRO',
  ITEM_BLACK_BELT: 'CINT. NEGRO', ITEM_SPELL_TAG: 'HECHIZO', ITEM_TWISTED_SPOON: 'CUCH. TORCIDA',
  ITEM_DRAGON_FANG: 'COLM. DRAGÓN', ITEM_SILK_SCARF: 'PAÑUELO SEDA', ITEM_SHELL_BELL: 'CASC. CONCHA',
  ITEM_SEA_INCENSE: 'INC. MARINO', ITEM_LAX_INCENSE: 'INC. SUAVE', ITEM_METAL_POWDER: 'POLVO METAL',
  ITEM_YELLOW_SCARF: 'PAÑUELO AMAR.', ITEM_MACH_BIKE: 'BICI CARRERA', ITEM_SS_TICKET: 'TICKET BARCO',
  ITEM_CONTEST_PASS: 'PASE CONCURSO', ITEM_SOOT_SACK: 'SACO CENIZA', ITEM_BASEMENT_KEY: 'LLAVE SÓTANO',
  ITEM_ACRO_BIKE: 'BICI ACROB.', ITEM_POKEBLOCK_CASE: 'TUBO {POKEBLOCK}', ITEM_GO_GOGGLES: 'GAFAS AISL.',
  ITEM_DEVON_SCOPE: 'DETECTOR', ITEM_OAKS_PARCEL: 'PAQUETE OAK', ITEM_BIKE_VOUCHER: 'BONO BICI',
  ITEM_GOLD_TEETH: 'DIENTES ORO', ITEM_CARD_KEY: 'LLAVE MAGN.', ITEM_LIFT_KEY: 'LLAVE ASC.',
  ITEM_TM_CASE: 'ESTUCHE MT', ITEM_MYSTIC_TICKET: 'MISTITICKET', ITEM_POWDER_JAR: 'BOTE POLVOS',
};
for (const [key, name] of Object.entries(itemNames)) catalog['src/data/items.json'][key].name = name;
for (const item of JSON.parse(original('src/data/items.json')).items) {
  if (item.moveId) catalog['src/data/items.json'][item.itemId].description = catalog['src/move_descriptions.c']['gMoveDescription_' + item.moveId].to;
}
for (const [key, to] of Object.entries({ TYPE_FLYING: 'VOLAD.', TYPE_BUG: 'BICHO', TYPE_GHOST: 'FANT.' })) {
  catalog['src/battle_main.c'][key].to = to;
}
const trainerFile = 'src/data/text/trainer_class_names.h';
const trainers = original(trainerFile);
catalog[trainerFile] = {};
for (const key of ['TRAINER_CLASS_NONE', 'TRAINER_CLASS_PKMN_TRAINER_UNUSED', 'TRAINER_CLASS_PKMN_TRAINER']) {
  const match = trainers.match(new RegExp('\\[' + key + '\\]\\s*=\\s*_\\("([^"\\n]+)"\\)'));
  if (!match) throw new Error(`Missing trainer class ${key}`);
  catalog[trainerFile][key] = { from: match[1], to: 'ENTRENADOR' };
}
// Fit battle text to the actual GBA dialog width. Subsequent lines scroll,
// rather than drawing a third line outside the two-line battle textbox.
const estimate = (text) => pixelWidth(text.replace(/\{([^}]+)\}/g, (_, token) => {
  if (/NAME_WITH_PREFIX/.test(token)) return 'WWWWWWWWWWWWWWW';
  if (/NAME|ABILITY|MOVE|B_BUFF/.test(token)) return 'WWWWWWWWWWWW';
  return '';
}));
for (const [key, entry] of Object.entries(catalog['src/battle_message.c'])) {
  if (!key.startsWith('sText_') || /Prefix/.test(key)) continue;
  const parts = entry.to.split(/(\\[nlp])/);
  let lines = 1, out = '';
  for (const part of parts) {
    if (/^\\[nlp]$/.test(part)) {
      out += part === '\\p' ? part : lines >= 2 ? '\\l' : part;
      lines = part === '\\p' ? 1 : lines + 1;
      continue;
    }
    if (estimate(part) <= 204) { out += part; continue; }
    const protectedPart = part.replace(/\{[^}]+\}/g, (token) => token.replace(/ /g, '\u0001'));
    let line = '';
    for (let word of protectedPart.split(/\s+/)) {
      word = word.replace(/\u0001/g, ' ');
      if (line && estimate(line + ' ' + word) > 204) {
        out += line + (lines >= 2 ? '\\l' : '\\n'); lines++; line = word;
      } else line += (line ? ' ' : '') + word;
    }
    out += line;
  }
  entry.to = out;
}
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
