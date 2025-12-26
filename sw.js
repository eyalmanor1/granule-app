/* Manor Engineering PWA Service Worker */
const CACHE_NAME = 'manor-tools-v5';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png'
];

self.addEventListener('install', (event)=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', (event)=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME ? caches.delete(k) : null)))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', (event)=>{
  const req = event.request;
  // Only handle GET
  if(req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached)=>{
      if(cached) return cached;
      return fetch(req).then((resp)=>{
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(req, copy)).catch(()=>{});
        return resp;
      }).catch(()=>cached);
    })
  );
});
