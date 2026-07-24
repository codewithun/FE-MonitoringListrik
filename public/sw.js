const CACHE_NAME = "wattwise-pwa-v3"
const OFFLINE_URL = "/offline"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL]))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  const requestUrl = new URL(event.request.url)

  if (!["http:", "https:"].includes(requestUrl.protocol)) return

  if (
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith("/api/")
  ) {
    return
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request)
      if (cached) return cached

      if (event.request.mode === "navigate") {
        return caches.match(OFFLINE_URL)
      }

      return new Response("", {
        status: 503,
        statusText: "Offline",
        headers: {
          "Cache-Control": "no-store",
        },
      })
    })
  )
})

self.addEventListener("push", (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || "Notifikasi WattWise";
      const options = {
        body: data.body || "Anda mendapat pesan baru.",
        icon: "/logo.png",
        badge: "/logo.png",
        data: {
          url: data.url || "/user",
        },
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error("Push data is not valid JSON", e);
    }
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || "/user";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

