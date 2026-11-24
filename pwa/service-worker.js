/* global release, clients */
const cachePrefix = 'taskforge-static-'
const assets = new Set(release.paths)

self.addEventListener('install', event => {
  // A new worker waits until the old tabs close so in-flight edits aren't interrupted.
  event.waitUntil(caches.open(release.cache).then(cache =>
    cache.addAll(release.paths.map(path => new Request(path,{cache:'reload',credentials:'omit'}))),
  ))
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== release.cache).map(key => caches.delete(key)))
    await clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const {request} = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      url.pathname === '/api' || url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    // Cache only the build's public shell, never a live navigation response.
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(release.cache)
      return (await cache.match('/index.html')) ?? Response.error()
    }))
  } else if (assets.has(url.pathname) && !url.search) {
    event.respondWith((async () => {
      const cache = await caches.open(release.cache)
      return (await cache.match(request)) ?? fetch(request)
    })())
  }
})
