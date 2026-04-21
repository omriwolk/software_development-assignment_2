/*
Service Worker Flow:

	1. Install:
	   - Opens cache and stores core site files for offline use.

	2. Activate:
	   - Removes old caches and takes control of all pages.

	3. Fetch:
	   - HTML requests → Network first, fallback to offline page if failed.
	   - CSS/JS/images → Cache first, fallback to network if not cached.

Result:
- Faster loading, offline support, and up-to-date pages.
*/

// Name of the cache storage (used to version your cache)
const CACHE_NAME = "portfolio-v2";

// List of core files to cache when the service worker installs
const STATIC_CACHE = [
  "/",                     // Root page
  "/index.html",           // Main homepage
  "/main.css",             // Main stylesheet
  "/offline.html",         // Fallback page when offline
  "/about/index.html",     // About page
  "/skills/index.html",    // Skills page
  "/qualifications/index.html" // Qualifications page
];

// Install event (runs when service worker is first installed)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Open the cache and store all core assets
      return cache.addAll(STATIC_CACHE);
    })
  );
  self.skipWaiting();
  // Forces the new service worker to activate immediately
});

// Activate event (runs after install, when SW takes control)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Delete old caches that don't match the current version
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
  // Makes the service worker control all pages immediately
});

// Fetch event (intercepts all network requests)
self.addEventListener("fetch", (event) => {
  const request = event.request;
  // The request being made (page, CSS, image, etc.)

  // Handle HTML pages differently (NETWORK FIRST strategy)
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          // Clone response because it can only be used once

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
            // Save a copy of the latest page in cache
          });

          return response;
          // Return fresh content from network
        })
        .catch(() => caches.match("/offline.html"))
        // If network fails, show offline fallback page
    );
    return;
  }

  // Handle CSS, JS, images (CACHE FIRST strategy)
  event.respondWith(
    caches.match(request).then((cached) => {
      // Try to find the resource in cache first
      return cached || fetch(request);
      // If not cached, fetch from network
    })
  );
});
