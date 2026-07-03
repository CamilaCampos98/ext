const CACHE_NAME = "soneca-pwa-v62";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=29",
  "./app.js?v=62",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "notify") return;
  self.registration.showNotification(event.data.title, {
    body: event.data.body,
    icon: "icon.svg",
    badge: "icon.svg",
    tag: event.data.tag || "soneca-alerta"
  });
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Soneca", {
      body: payload.body || "",
      icon: "icon.svg",
      badge: "icon.svg",
      tag: payload.tag || "soneca-alerta"
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const visibleClient = clientList.find((client) => "focus" in client);
      if (visibleClient) return visibleClient.focus();
      if (clients.openWindow) return clients.openWindow("./");
      return undefined;
    })
  );
});
