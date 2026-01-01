const CACHE_NAME = 'estiba-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './src/styles/styles.css',
  './src/core/app.js',
  './src/modules/sueldometro.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
