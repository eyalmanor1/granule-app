/* Manor PWA Service Worker */
const CACHE_VERSION = "v1.0.0";
const CORE_CACHE = `core-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "./",
  "./install.html",
  "./manifest.webmanifest",
  "./ms9.html",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (![CORE_CACHE, RUNTIME_CACHE].includes(k)) return caches.delete(k);
    }));
    await self.clients.claim();
  })());
});

// Stale-while-revalidate for navigation + runtime requests
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== location.origin) return;

  // Navigation requests: serve cached install/app quickly
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CORE_CACHE);
      const cached = await cache.match("./ms9.html") || await cache.match("./install.html");
      try {
        const fresh = await fetch(req);
        // update runtime cache with fresh page
        const rcache = await caches.open(RUNTIME_CACHE);
        rcache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        // offline fallback
        const fromRuntime = await (await caches.open(RUNTIME_CACHE)).match(req);
        return fromRuntime || cached || new Response("Offline", { status: 200, headers: { "Content-Type": "text/plain" }});
      }
    })());
    return;
  }

  // Other requests: stale-while-revalidate
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req).then((res) => {
      // cache successful basic responses
      if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone());
      return res;
    }).catch(() => null);

    return cached || (await fetchPromise) || new Response("", { status: 504 });
  })());
});