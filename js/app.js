self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('youthpulse-cache').then((cache) => {
      return cache.addAll([
        '/index.html',
        '/style.css',
        '/js/app.js',
        '/js/game.js',
        '/js/badges.js',
 probably more.
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // For navigation requests, serve index.html from cache
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.url.includes(window.location.origin))) {
    event.respondWith(
      caches.match('/index.html').then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }
  // For other requests, use normal fetch with cache fallback
  event.respondWith(
    caches.open('youthpulse-cache').then((cache) => {
      return cache.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // Cache successful responses
          if (event.request.method === 'GET' && event.request.url.startsWith(window.location.origin)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      });
    })
  );
});