const CACHE_NAME = 'kumt-engine-v1';
const STATIC_SHELL = [
  '/',
  '/index.html',
  '/css/style.min.css',
  '/js/app.js',
  '/js/marked.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_SHELL))
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
  if (STATIC_SHELL.includes(url.pathname) || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
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
