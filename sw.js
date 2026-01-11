const CACHE = "vsa-pwa-v1";
const CORE = [
  "./",
  "./index.html",
  "./app.html",
  "./manifest.webmanifest",
  "./sw.js",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(req);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return (await cache.match("./app.html")) || (await cache.match("./index.html"));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    const fresh = await fetch(req);
    if (fresh && fresh.status === 200 && fresh.type === "basic") cache.put(req, fresh.clone());
    return fresh;
  })());
});