const CACHE_NAME = "portfolio-v2";

// Core assets (CACHE FIRST)
const STATIC_CACHE = [
  "/",
  "/index.html",
  "/main.css",
  "/offline.html",
  "/about/index.html",
  "/skills/index.html",
  "/qualifications/index.html"
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // HTML pages → NETWORK FIRST (best for updates)
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // CSS / JS / images → CACHE FIRST
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request);
    })
  );
});
