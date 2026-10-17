import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { startServer, launchBrowser, sleep } from './lib.mjs';
const out = 'output/playwright/pwa';
mkdirSync(out, { recursive: true });
const server = await startServer(), browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'es-AR' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${server.url}/?lang=es&seed=42`);
  assert.equal(await page.locator('#install-panel').isVisible(), true);
  await page.screenshot({ path: `${out}/invitation.png` });
  await sleep(3200);
  assert.equal(await page.locator('#install-panel').isVisible(), false);
  await page.locator('#install').tap();
  assert.equal(await page.locator('#install-panel').isVisible(), true);
  await page.evaluate(() => {
    window.installCalls = 0;
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = async () => { window.installCalls++; };
    event.userChoice = Promise.resolve({ outcome: 'dismissed' });
    dispatchEvent(event);
  });
  assert.equal(await page.evaluate(() => window.installCalls), 0);
  await page.locator('#install-action').tap();
  assert.equal(await page.evaluate(() => window.installCalls), 1);
  await page.locator('#install').tap();
  assert.equal(await page.locator('#install-action').isVisible(), false);
  await page.locator('#install-close').tap();
  await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.active);
  await page.reload();
  assert.equal(await page.locator('#install-panel').isVisible(), false);
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  const manifest = await page.evaluate(async () => (await fetch('manifest.webmanifest')).json());
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    assert.equal(await page.evaluate(async src => {
      const image = new Image(); image.src = src; await image.decode(); return `${image.width}x${image.height}`;
    }, icon.src), icon.sizes);
  }
  await page.locator('#play').tap(); await page.locator('#begin').tap();
  await page.waitForFunction(() => window.dailyRed?.emulator, null, { timeout: 60000 });
  await sleep(8000);
  assert.equal(await page.locator('#capture, #record, #capture-result').count(), 0);
  await page.screenshot({ path: `${out}/playing.png` });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  // Cached ROM/core boot when offline, preserving the same practice URL.
  await page.context().setOffline(true);
  await page.reload();
  await page.locator('#play').tap(); await page.locator('#begin').tap();
  await page.waitForFunction(() => window.dailyRed?.emulator, null, { timeout: 60000 });
  await page.context().setOffline(false);
  await page.evaluate(() => dispatchEvent(new Event('appinstalled')));
  assert.equal(await page.locator('#install').isVisible(), false);
  assert.deepEqual(errors, []);
  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    const native = window.matchMedia.bind(window);
    window.matchMedia = query => query === '(display-mode: standalone)'
      ? { matches: true, addEventListener() {} } : native(query);
  });
  await fallback.goto(`${server.url}/?lang=en`);
  assert.equal(await fallback.locator('#install').isVisible(), false);
  assert.equal(await fallback.locator('#install-panel').isVisible(), false);
  console.log('PASS: 3s invitation/reopen/native-event consumption; standalone; manifest/icons; offline real ROM boot; mobile layout without capture/record controls; no page errors.');
} finally { await browser.close(); server.close(); }
