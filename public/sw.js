const CACHE_NAME = 'estiba-v1';
const BASE = '/Estiba/';

const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
