// Service Worker SERVICE RAPIDE
const CACHE_NAME = 'service-rapide-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// Installation : mise en cache des ressources statiques initiales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie réseau d'abord avec secours sur le cache pour les requêtes de navigation
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Ignorer les requêtes non-GET et les requêtes vers les APIs externes ou base de données
  if (req.method !== 'GET') return;
  if (req.url.includes('/api/') || req.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // Mettre à jour le cache si ressource statique valide
        if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      })
      .catch(() => {
        // Secours sur le cache hors-ligne
        return caches.match(req).then((cachedRes) => {
          if (cachedRes) return cachedRes;
          if (req.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
