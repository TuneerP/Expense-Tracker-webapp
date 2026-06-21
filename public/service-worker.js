// Minimal service worker for installability (Add to Home Screen on iOS/Android).
// Intentionally does NOT cache API responses or pages — this app needs fresh,
// per-user data on every load, so we don't risk serving stale or cross-user content.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// No fetch handler — all requests pass through to the network as normal.
