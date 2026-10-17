// Rasterize the existing favicon, with opaque padding for home-screen masks.
// Requires the project's tests/ dependencies and installed Chrome.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { launchBrowser } from '../tests/lib.mjs';
const source = readFileSync(new URL('../web/favicon.svg', import.meta.url), 'utf8');
const directory = new URL('../web/icons/', import.meta.url);
mkdirSync(directory, { recursive: true });
const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  for (const [name, size, padding] of [
    ['icon-192.png', 192, 0], ['icon-512.png', 512, 0],
    ['maskable-512.png', 512, 0.15], ['apple-touch-icon.png', 180, 0.08],
  ]) {
    const base64 = await page.evaluate(async ({ source, size, padding }) => {
      const image = new Image();
      image.src = `data:image/svg+xml,${encodeURIComponent(source)}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d');
      context.fillStyle = '#25333e'; context.fillRect(0, 0, size, size);
      context.imageSmoothingEnabled = false;
      context.drawImage(image, size * padding, size * padding, size * (1 - 2 * padding), size * (1 - 2 * padding));
      return canvas.toDataURL('image/png').split(',')[1];
    }, { source, size, padding });
    writeFileSync(new URL(name, directory), Buffer.from(base64, 'base64'));
  }
} finally { await browser.close(); }
