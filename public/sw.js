/* Cine-Flow service worker.
 * - Hashed build assets (/assets/*) and icons: cache-first (they are immutable).
 * - Page navigations: always network; offline.html only when the network fails.
 * - Everything else (API, HLS segments, images, cross-origin) is left to the browser.
 * - Web push: shows new-episode / watch-party notifications; a tap focuses or opens the page.
 */
const VERSION = "cf-v2";
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/favicon.png"];
const MAX_STATIC_ENTRIES = 200;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isImmutableAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/"))
  );
}

async function trimCache(cache) {
  const keys = await cache.keys();
  const excess = keys.length - MAX_STATIC_ENTRIES;

  for (let i = 0; i < excess; i += 1) {
    if (!PRECACHE.includes(new URL(keys[i].url).pathname)) await cache.delete(keys[i]);
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);

  if (hit) return hit;

  const response = await fetch(request);

  if (response.ok && response.type === "basic") {
    await cache.put(request, response.clone());
    void trimCache(cache);
  }

  return response;
}

async function networkWithOfflineFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const fallback = await caches.match(OFFLINE_URL);

    if (fallback) return fallback;

    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkWithOfflineFallback(request));

    return;
  }

  if (isImmutableAsset(url)) event.respondWith(cacheFirst(request));
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Cine-Flow";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: data.icon || "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((w) => w.url.startsWith(self.location.origin));

      if (existing) {
        return existing.focus().then((w) => (w && "navigate" in w ? w.navigate(target) : w));
      }

      return self.clients.openWindow(target);
    }),
  );
});
