// VSA PWA Service Worker (index)
const CACHE_NAME = 'vsa-cache-index';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try{
      const keys = await caches.keys();
      await Promise.all(keys.map(k => (k.startsWith('vsa-cache-') && k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
    }catch(_){}
    self.clients.claim();
  })());
});

// Cache-first for same-origin GET, network fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req, {ignoreSearch: true});
    if (cached) return cached;
    try{
      const fresh = await fetch(req);
      // Best-effort cache
      if (fresh && fresh.ok) cache.put(req, fresh.clone()).catch(() => {});
      return fresh;
    }catch(_){
      // fallback to app shell
      const shell = await cache.match('./index.html');
      return shell || new Response('Offline', {status: 503, headers:{'Content-Type':'text/plain'}});
    }
  })());
});
