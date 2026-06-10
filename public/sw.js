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
