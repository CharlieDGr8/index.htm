/* Cypher Protocol — service worker.
 *
 * Strategy: network-first for everything, cache as the fallback.
 *
 * The previous worker served from cache first, which is faster but means a
 * new build never reaches the device: the app keeps running whatever was
 * cached the day it was installed. This version always tries the network,
 * so an update lands on the next launch with a signal, and falls back to the
 * cache the moment you're offline. A basement with no bars still works.
 *
 * Bump CACHE whenever the file list changes. Changing this file at all is
 * what triggers the browser to re-check the worker.
 */

const CACHE = "cypher-protocol-v4";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      // Take over immediately instead of waiting for every tab to close.
      // Without this an update can sit idle for weeks.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;

  // Only handle our own files. Map tiles and the weather API go straight out.
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        // Stash a fresh copy for the next time there's no signal.
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(hit => hit || caches.match("./index.html"))
      )
  );
});

// Lets the page force an update without a reinstall.
self.addEventListener("message", e => {
  if (e.data === "cp-update") self.skipWaiting();
});
