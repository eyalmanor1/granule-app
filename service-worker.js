// Auto-generated PWA Service Worker (Manor Autopilot)
// Build: bd8fae3492

const CACHE = "manor-autopilot-v15-bd8fae3492";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./version.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/logo.png",
  "./screenshots/screen-1.png",
  "./screenshots/screen-2.png",
];

function normalizeRequest(request) {
  // Strip cache-busting params so we don't store duplicates.
  const url = new URL(request.url);
  url.searchParams.delete("v");
  url.searchParams.delete("rev");
  return new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    mode: request.mode,
    credentials: request.credentials,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    integrity: request.integrity,
    cache: "reload",
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation =
    event.request.mode === "navigate" ||
    (event.request.headers.get("accept") || "").includes("text/html");

  const normalized = normalizeRequest(event.request);

  event.respondWith(
    caches.match(normalized, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(normalized, copy)).catch(() => {});
          return res;
        })
        .catch(() => {
          if (isNavigation) {
            return caches.match("./offline.html").then((r) => r || caches.match("./index.html"));
          }
          return cached;
        });
    })
  );
});
