/* ms30 - VSA PWA Service Worker */
const CACHE_NAME = "vsa-cache-ms30";
const ASSETS = [
  "./",
  "./index.html",
  "./app.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png"
];

async function broadcast(msg) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  for (const c of clients) {
    c.postMessage(msg);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    try {
      await broadcast({ type: "SW_STATUS", status: "installing" });
      const cache = await caches.open(CACHE_NAME);
      let done = 0;
      const total = ASSETS.length;
      for (const url of ASSETS) {
        try {
          // Cache sequentially to enable progress
          const req = new Request(url, { cache: "reload" });
          const res = await fetch(req);
          if (res && res.ok) {
            await cache.put(url, res.clone());
          }
        } catch (e) {
          // ignore single-asset failure; keep going
        }
        done++;
        await broadcast({ type: "SW_PROGRESS", done, total });
      }
      await broadcast({ type: "SW_DONE", cache: CACHE_NAME });
      self.skipWaiting();
    } catch (e) {
      await broadcast({ type: "SW_ERROR", error: String(e) });
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Cleanup old caches
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k.startsWith("vsa-cache-") && k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
    await broadcast({ type: "SW_STATUS", status: "active", cache: CACHE_NAME });
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req, { ignoreSearch: false });
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) {
        // Put a copy in cache for next time
        cache.put(req, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch (e) {
      // Offline fallback: try cached root/app
      const fallback = await cache.match("./app.html");
      return fallback || new Response("Offline", { status: 503, statusText: "Offline" });
    }
  })());
});