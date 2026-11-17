const CACHE_NAME = 'stressless-shell-v4'
const OFFLINE_ROUTES = ['/', '/login', '/forgot-password', '/reset-password', '/profile', '/terms', '/privacy', '/cookies']
const OFFLINE_ASSETS = ['/', '/offline.html', '/manifest.webmanifest', '/icon.svg', '/apple-touch-icon.png', '/pwa-192.png', '/pwa-512.png']
const CACHE_TARGETS = [...new Set([...OFFLINE_ASSETS, ...OFFLINE_ROUTES])]

const isSameOrigin = (url) => url.origin === self.location.origin
const isApiRequest = (url) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')
const isStaticAsset = (url) => /\.(?:js|css|png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf|map)$/i.test(url.pathname)

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_TARGETS).catch(() => undefined))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  const message = event.data.json()
  const url = new URL(message.url || '/', self.location.origin)
  const targetUrl = url.origin === self.location.origin ? `${url.pathname}${url.search}${url.hash}` : '/'
  event.waitUntil(self.registration.showNotification(message.title || 'stressless alert', {
    body: message.body || '',
    icon: '/pwa-192.png',
    badge: '/icon.svg',
    data: { url: targetUrl }
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin)
  const path = targetUrl.origin === self.location.origin ? targetUrl.href : self.location.origin
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const client = clients.find((candidate) => new URL(candidate.url).origin === self.location.origin)
    if (client) {
      client.navigate(path)
      return client.focus()
    }
    return self.clients.openWindow(path)
  }))
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== 'GET' || !isSameOrigin(url)) return
  if (isApiRequest(url)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request.url, copy))
              .catch(() => undefined)
            return response
          }
          return caches.match('/offline.html') || caches.match('/')
        })
        .catch(() => caches.match('/offline.html') || caches.match('/'))
    )
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached

        return fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone()
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, copy))
                .catch(() => undefined)
            }
            return response
          })
          .catch(() => caches.match('/offline.html'))
      })
    )
  }
})
