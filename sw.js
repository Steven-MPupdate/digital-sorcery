/**
 * sw.js — Service worker: makes the app work offline after the first visit.
 *
 * What it does:  On install, saves the "app shell" (every file the app needs) into a cache.
 *                On each request for one of OUR files, serves the cached copy first, then
 *                quietly refreshes it from the network for next time.
 * Registered by: src/app.js (registerServiceWorker).
 *
 * IMPORTANT: Bump CACHE_VERSION whenever any file in APP_SHELL changes, or returning
 * visitors may keep seeing old files. (Rule in CLAUDE.md §6.)
 * SECURITY: Only same-origin GET requests are handled. Nothing from other sites is cached.
 */

const CACHE_VERSION = 'digital-sorcery-v1.0.0';

// DEV NOTE: Paths are relative to this file, so they work under /new-app/ on GitHub Pages
// and at the root of a custom domain.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/app.js',
  './src/spellbook.js',
  './src/incantation.js',
  './src/storage.js',
  './src/styles/brand.css',
  './src/styles/main.css',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/fonts/cinzel-latin-400-normal.woff2',
  './assets/fonts/cinzel-latin-600-normal.woff2',
  './assets/fonts/cormorant-garamond-latin-400-normal.woff2',
  './assets/fonts/cormorant-garamond-latin-400-italic.woff2',
  './assets/fonts/cormorant-garamond-latin-600-normal.woff2',
  './assets/fonts/montserrat-latin-500-normal.woff2',
  './assets/fonts/montserrat-latin-600-normal.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

// Delete caches from older versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // SECURITY: never touch other sites

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // Page navigations fall back to the cached index.html when offline.
      const cached = await cache.match(request, { ignoreSearch: true })
        || (request.mode === 'navigate' ? await cache.match('./index.html') : undefined);

      const network = fetch(request)
        .then((response) => {
          // Only cache good, same-origin ("basic") responses for files we already ship.
          if (response.ok && response.type === 'basic' && cached) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);

      return cached || network;
    }),
  );
});
