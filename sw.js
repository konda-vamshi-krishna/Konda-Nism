const CACHE_NAME = 'kumt-engine-v9';
// Cache version suffix appended to static assets for network-level proxy cache busting
const ASSET_VER = '?v=9';

// Relative URLs for caching during install phase (versioned to bust proxy/ISP caches)
const STATIC_SHELL_URLS = [
  './' + ASSET_VER,
  'index.html' + ASSET_VER,
  'css/style.min.css' + ASSET_VER,
  'js/app.js' + ASSET_VER,
  'js/marked.min.js' + ASSET_VER
];

// Path endings to intercept during fetch phase (match without version param)
const STATIC_SHELL_MATCHES = [
  '/',
  '/index.html',
  '/css/style.min.css',
  '/js/app.js',
  '/js/marked.min.js'
];

// CDN host match for pdf.js lazy-loaded binaries
const PDF_CDN_HOST = 'cdnjs.cloudflare.com';
const PDF_CDN_PATH = '/ajax/libs/pdf.js/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_SHELL_URLS))
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => { if (key !== CACHE_NAME) return caches.delete(key); })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Pass non-GET requests through directly to the network
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // BUG-04 FIX: Explicitly exclude all API traffic to openrouter.ai from any
  // caching strategy. The Strategy A .js catch-all is too broad and could
  // intercept a proxy-rewritten API URL. Hard-pass all openrouter.ai requests.
  if (url.hostname === 'openrouter.ai') return;

  // Strategy A: Cache-First for Immutable Static Core Assets
  // ponytail: BUG-07 — scoped to same-origin only → upgrade path is a full allowlist per-host
  const isStaticShell = STATIC_SHELL_MATCHES.some(path => url.pathname.endsWith(path));
  if ((isStaticShell || url.pathname.endsWith('.css') || url.pathname.endsWith('.js'))
      && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  // Strategy C: Cache-First for pdf.js CDN binaries (pdf.min.js + pdf.worker.min.js)
  // These are large, immutable, versioned assets — cache aggressively after first load
  if (url.hostname === PDF_CDN_HOST && url.pathname.includes(PDF_CDN_PATH)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(networkResponse => {
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy B: Hardened Stale-While-Revalidate with Change Detection Broadcast
  if (url.pathname.includes('/content/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const networkFetch = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Compare bodies to detect genuine updates if cached copy exists (JSON only)
              if (cachedResponse && url.pathname.endsWith('.json')) {
                Promise.all([cachedResponse.clone().text(), networkResponse.clone().text()]).then(([oldText, newText]) => {
                  if (oldText !== newText) {
                    cache.put(event.request, responseClone);
                    // Broadcast to client that content has changed in the background
                    self.clients.matchAll().then(clients => {
                      clients.forEach(client => client.postMessage({
                        type: 'CONTENT_UPDATED',
                        url: event.request.url
                      }));
                    });
                  }
                });
              } else {
                cache.put(event.request, responseClone);
              }
            });
            return networkResponse;
          }
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || networkFetch;
      })
    );
  }
});
