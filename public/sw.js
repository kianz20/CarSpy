// Minimal service worker — this app is entirely DB-driven (search results,
// listing details), so there's no real offline experience to cache; the
// only jobs here are (1) qualifying the site as an installable PWA, which
// needs a registered service worker with a fetch handler, and (2) showing a
// real "you're offline" page instead of the browser's own dino/network-error
// page when a navigation fails with no connection.
const CACHE = "carspy-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Only intercept full-page navigations — every other request (API calls,
  // Next's own JS/CSS chunks, images) passes straight through to the
  // network, since caching stale search results or app code would be worse
  // than just letting them fail normally.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
  );
});
