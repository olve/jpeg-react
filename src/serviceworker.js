const CACHE_NAME = 'boilerplate-cache'
const urlsToCache = [
  '/',
  '/index.html',
  '/vendor.bundle.js',
  '/app.bundle.js',
]

/* figure out how to serve a loading-indicator response while
   waiting for timeout before using commented code.
   currently the "Page not available" error is shown while waiting

   const fetchTimeout = 0

   self.addEventListener('fetch', event => {
     function timeoutCache(delay) {
       return new Promise((resolve, reject) => {
         resolve(setTimeout(() => caches.match(event.request).then(response => response), delay))
       })
     }
     event.respondWith(Promise.race([timeoutCache(fetchTimeout)], fetch(event.request).catch(() => response)))
   })

*/



//caches to not delete on-activate
const cacheWhitelist = []

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache)
    })
  )
})
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {

      //try fetching new version; otherwise (if offline) serve cached
      return fetch(event.request).catch( () => response )

    })
  )
})
self.addEventListener('activate', event => {
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => {
        if (cacheWhitelist.indexOf(cacheName) === -1) {
          return caches.delete(cacheName)
        }
      })
    )
  })
})
