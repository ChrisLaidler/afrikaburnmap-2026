// Service worker: pre-cache the small set of static assets so the site works offline.
// Bump CACHE_VERSION when any of the cached files change so clients fetch a fresh copy.
const CACHE_VERSION = "v9";
const CACHE_NAME = "ab-map-" + CACHE_VERSION;
const ASSETS = [
  "./",
  "./index.html",
  "./data.js",
  "./2026_AfrikaBurnMap-scaled.jpg",
  "./2026_Site_map_highres.jpg",
  "./2026_Site_map_highres_mobile.jpg",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for same-origin GETs. Network for everything else (analytics, etc.).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let analytics fall through to network

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        // If it's one of our known assets and the fetch succeeded, stash it
        if (resp && resp.ok && resp.type === "basic") {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
