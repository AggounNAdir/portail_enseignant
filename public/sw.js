// Service Worker Kill-Switch / Self-Unregistering
// Désinscrit tout ancien service worker et vide les caches pour rétablir l'accès direct
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
      .then(() => {
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          for (const client of clients) {
            client.navigate(client.url);
          }
        });
      })
  );
});

// Aucun écouteur fetch : laisser le réseau gérer 100% des requêtes sans aucune interception
