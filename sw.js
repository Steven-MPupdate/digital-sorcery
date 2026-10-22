/**
 * sw.js: Service worker: makes the app work offline after the first visit.
 *
 * What it does:  On install, saves the "app shell" (every file the app needs) into a cache.
 *                Online:  every request goes to the network first (fresh files, always
 *                         matching each other), and the cache copy is refreshed.
 *                Offline: the cached copy is served instead.
 * Depends on:    nothing (but APP_SHELL must list every file the page loads).
 * Registered by: src/app-tools.js (initAppTools).
 *
 * IMPORTANT: Bump CACHE_VERSION whenever any file in APP_SHELL changes, so old caches
 * are cleaned up. (Rule in CLAUDE.md §6.)
 * SECURITY: Only same-origin GET requests are handled. Nothing from other sites is cached.
 *
 * DEV NOTE (why network-first, see DECISIONS D9): the first version served the cache first.
 * The Trial by Fire showed that could mix new HTML with old JavaScript after a release,
 * trap visitors on the old address after a domain move, and show a broken page for
 * unknown URLs. Network-first avoids all three; the cost is one quick request per file
 * when online (usually a cheap "not modified" reply).
 */

const CACHE_VERSION = 'digital-sorcery-v1.2.0';

// DEV NOTE: Paths are relative to this file, so they work under /digital-sorcery/ on GitHub Pages
// and at the root of a custom domain.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/app.js',
  './src/spellbook.js',
  './src/incantation.js',
  './src/storage.js',
  './src/portals.js',
  './src/examples.js',
  './src/app-tools.js',
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

// Full URLs of the shell files, used to decide what may be stored in the cache.
const SHELL_URLS = new Set(APP_SHELL.map((path) => new URL(path, self.location).href));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // DEV NOTE: cache: 'reload' skips the browser's HTTP cache, so a new release never
      // fills its offline cache with old copies of files.
      .then((cache) => cache.addAll(APP_SHELL.map((path) => new Request(path, { cache: 'reload' }))))
      // DEV NOTE: skipWaiting + clients.claim (below) let the new worker take over open tabs
      // right away. Safe because every online request is network-first anyway.
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

/** Is this URL the app's own page (the folder root or index.html)? */
function isAppPage(url) {
  const scope = new URL(self.registration.scope);
  return url.pathname === scope.pathname || url.pathname === `${scope.pathname}index.html`;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // SECURITY: never touch other sites

  const isNavigation = request.mode === 'navigate';
  // Pages other than the app itself (e.g. a typo URL or a license file) are left to the
  // network entirely, so they show their real content or a real 404.
  if (isNavigation && !isAppPage(url)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // DEV NOTE: ignoreSearch so "./?utm=..." still finds the cached page offline.
    const cacheKey = isNavigation ? './index.html' : request;
    try {
      // cache: 'no-cache' = always ask the server if the file changed (cheap 304 if not).
      const response = await fetch(request, { cache: 'no-cache' });
      const cacheable = response.ok && response.type === 'basic' && (isNavigation || SHELL_URLS.has(url.href));
      if (cacheable) event.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch {
      const cached = await cache.match(cacheKey, { ignoreSearch: true });
      return cached || Response.error();
    }
  })());
});
