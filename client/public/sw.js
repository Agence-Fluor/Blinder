const cacheName = 'my-pwa-cache-v1';
const assets = [
//  '/',
//  '/index.html',
//  '/style.css',
//  '/app.js',
//  '/icons/icon-192.png'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assets))
  );
});

// Fetch event (serve from cache if available)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
