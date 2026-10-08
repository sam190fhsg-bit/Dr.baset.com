/* Clinic navigation repair: retire the previous broad HTML/JS cache.
   Let the browser request fresh files; this worker is deliberately network-only. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('clinic-static-')).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});
