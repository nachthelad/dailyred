import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..', 'pokefirered');
const charmap = readFileSync(resolve(root, 'charmap.txt'), 'utf8');
const codes = new Map([...charmap.matchAll(/^'(.)'\s*=\s*([0-9A-F]{2})/gm)].map((m) => [m[1], parseInt(m[2], 16)]));
const text = readFileSync(resolve(root, 'src/text.c'), 'utf8');
const widths = text.match(/static const u8 sFontNormalLatinGlyphWidths\[\]\s*=\s*\{([^}]+)\}/)[1].match(/\d+/g).map(Number);
export const pixelWidth = (str) => [...str].reduce((n, ch) => n + (widths[codes.get(ch)] ?? 6), 0);
export function wrap(text, max = 110) {
  const lines = []; let line = '';
  for (const word of text.replace(/\s+/g, ' ').trim().split(' ')) {
    const next = line + (line ? ' ' : '') + word;
    if (line && pixelWidth(next) > max) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
