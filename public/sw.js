const CACHE_NAME = 'doit-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use catch() to prevent one missing file from failing the whole install
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => console.log('Failed to cache', url, err));
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Exclude Supabase API from service worker caching (let network handle it or our app's offline queue)
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Cache dynamic assets on the fly
        return caches.open(CACHE_NAME).then((cache) => {
          if (response.ok && event.request.url.startsWith('http')) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      });
    }).catch(() => {
      // Fallback if offline and not in cache
      return caches.match('/index.html');
    })
  );
});
