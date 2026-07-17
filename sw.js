const CACHE_NAME = 'kumt-engine-v5';
// Cache version suffix appended to static assets for network-level proxy cache busting
const ASSET_VER = '?v=5';

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
  const url = new URL(event.request.url);

  // Strategy A: Cache-First for Immutable Static Core Assets
  const isStaticShell = STATIC_SHELL_MATCHES.some(path => url.pathname.endsWith(path));
  if (isStaticShell || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
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
              // Compare bodies to detect genuine updates if cached copy exists
              if (cachedResponse) {
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
