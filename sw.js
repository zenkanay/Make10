const CACHE_NAME = 'make10-cache-v91';
const ASSETS_TO_CACHE = [
  './index.html',
  './css/style.css?v=91',
  './js/script.js?v=91',
  './favicon.png',
  './apple-touch-icon.png',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Outfit:wght@100..900&display=swap',
  'https://cdn.jsdelivr.net/npm/mathlive@0.110.0/mathlive-fonts.css',
  'https://cdn.jsdelivr.net/npm/mathlive@0.110.0/mathlive.mjs',
  'https://cdn.jsdelivr.net/npm/@cortex-js/compute-engine@0.24.0/dist/compute-engine.min.js',
  'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
