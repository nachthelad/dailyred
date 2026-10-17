// Bump this version whenever a shipped browser asset changes. New workers wait
// for all existing clients to close: never replace/reload an active battle.
const CACHE = 'dailyred-v6';
const SHELL = [
  './', 'index.html', 'app.js', 'daily.js', 'game-files.js', 'game-link.js',
  'i18n.js', 'rom-config.js', 'pwa.js', 'style.css', 'favicon.svg',
  'manifest.webmanifest', 'flags/es.svg', 'flags/en.svg', 'game/red.png',
  'vendor/nostalgist.js', 'vendor/pixelify-sans.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
];
const LAZY = ['game/dailyred.gba.gz', 'game/dailyred-es.gba.gz', 'vendor/mgba_libretro.js', 'vendor/mgba_libretro.wasm'];
const absolute = path => new URL(path, self.registration.scope).href;
const allowed = new Set([...SHELL, ...LAZY].map(absolute));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('dailyred-') && key !== CACHE).map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const navigation = request.mode === 'navigate' && url.origin === self.location.origin
    && [self.registration.scope, absolute('index.html')].includes(url.origin + url.pathname);
  const key = navigation ? absolute('index.html') : request.url;
  if (!allowed.has(key)) return;
  event.respondWith((async () => {
    let cache;
    try { cache = await caches.open(CACHE); }
    catch { return fetch(request); } // blocked storage must not block online play
    const hit = await cache.match(key);
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      try { await cache.put(key, response.clone()); }
      catch { /* quota/storage failure: return the valid online response */ }
    }
    return response;
  })());
});
