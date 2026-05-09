const CACHE_NAME = 'bds-manager-v2';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './icon.svg'
];

self.addEventListener('install', event => {
  // Skip waiting allows the new service worker to take over immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  // Claim clients so the new service worker controls them immediately
  event.waitUntil(self.clients.claim());
  
  // Clear old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('bds-manager-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Network-first strategy for index.html to always get latest updates, 
// cache-first for other static assets
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // If requesting the HTML page, try network first, then cache
  if (event.request.mode === 'navigate' || requestUrl.pathname === '/' || requestUrl.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  
  // For other assets (CSS, JS, images), try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
