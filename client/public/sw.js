/**
 * sw.js — Red Level Circle Service Worker
 * Handles Web Push notifications and PWA offline caching.
 */

const CACHE_NAME = "rlc-v1";

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Push event ───────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Red Level Circle", body: "Tienes una nueva notificación", icon: "/favicon.png", badge: "/favicon.png", url: "/", tag: "rlc-notification" };
  if (event.data) {
    try { data = { ...data, ...JSON.parse(event.data.text()) }; } catch {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: { url: data.url },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  );
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// ─── Fetch (network-first for API, cache-first for assets) ───────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Skip non-GET and API requests
  if (event.request.method !== "GET" || url.pathname.startsWith("/trpc")) return;
  // Cache-first for static assets
  if (url.pathname.match(/\.(png|webp|ico|svg|woff2|js|css)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached ?? fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return res;
      }))
    );
  }
});
