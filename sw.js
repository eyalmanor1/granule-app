// VSA PWA Service Worker (smart-cache 202601051200)
// Strategy:
// - Navigations (HTML): Network-first (fresh), fallback to cache/offline
// - Static same-origin assets: Stale-while-revalidate (fast + updates)
// - Auto-activate new SW (skipWaiting) + claim clients

const CACHE_VERSION = 'vsa-202601051200';
const CORE_CACHE = `vsa-core-${CACHE_VERSION}`;
const RUNTIME_CACHE = `vsa-runtime-${CACHE_VERSION}`;

// Core shell (keep small)
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CORE_CACHE);
    // Use cache:'reload' so we don't precache a stale HTTP-cached copy
    await Promise.all(
      CORE_ASSETS.map(async (url) => {
        try {
          const req = new Request(url, { cache: 'reload' });
          const res = await fetch(req);
          if (res && res.ok) await cache.put(url, res.clone());
        } catch (_) {
          // Ignore individual failures (offline on first load etc.)
        }
      })
    );
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => {
        if (!k.startsWith('vsa-')) return;
        if (k !== CORE_CACHE && k !== RUNTIME_CACHE) return caches.delete(k);
      })
    );
    await self.clients.claim();
  })());
});

// Allow page to force-activate update (optional)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch (_) {
    return false;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== 'GET') return;

  // Navigations: always try network first (fresh app), fallback to cached shell
  const isNav = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNav) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(new Request(req, { cache: 'no-store' }));
        const cache = await caches.open(CORE_CACHE);
        cache.put('./index.html', fresh.clone()).catch(()=>{});
        return fresh;
      } catch (_) {
        const cache = await caches.open(CORE_CACHE);
        const cached = await cache.match('./index.html');
        if (cached) return cached;
        return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  // Same-origin static assets: stale-while-revalidate
  if (isSameOrigin(req.url)) {
    event.respondWith((async () => {
      const runtime = await caches.open(RUNTIME_CACHE);
      const cached = await runtime.match(req);
      const fetchPromise = (async () => {
        try {
          const res = await fetch(req);
          if (res && res.ok) runtime.put(req, res.clone()).catch(()=>{});
          return res;
        } catch (_) {
          return null;
        }
      })();

      if (cached) {
        // Update in background
        fetchPromise.catch(()=>{});
        return cached;
      }

      const fresh = await fetchPromise;
      if (fresh) return fresh;

      // Last resort: try core cache (icons, manifest)
      const core = await caches.open(CORE_CACHE);
      const coreHit = await core.match(req);
      if (coreHit) return coreHit;

      return new Response('', { status: 504 });
    })());
  }
});
