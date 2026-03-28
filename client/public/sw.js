// GranuleCheck Service Worker
// Verzia cache – zmeňte pri každom deployi aby sa cache invalidoval
const CACHE_VERSION = 'animalPassport-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Statické súbory ktoré sa cachujú pri inštalácii (app shell)
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ─── INSTALL ────────────────────────────────────────────────────
// Pri inštalácii uložíme app shell do cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Cachujem statické súbory');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Aktivuj ihneď bez čakania na zatvorenie starých tabov
  self.skipWaiting();
});

// ─── ACTIVATE ───────────────────────────────────────────────────
// Pri aktivácii vymažeme staré cache verzie
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => {
            console.log('[SW] Mažem starý cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  // Okamžite prevezmi kontrolu nad všetkými tabmi
  self.clients.claim();
});

// ─── FETCH ──────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API volania – Network first, fallback na cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache only idempotent API requests (GET). Cache API does not support POST keys.
          if (request.method === 'GET' && response.ok) {
            const cloned = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback len pre GET requesty
          if (request.method === 'GET') {
            return caches.match(request);
          }

          // Pre mutačné requesty (POST/PUT/PATCH/DELETE) vráť sieťovú chybu
          throw new TypeError('Network error for non-GET API request');
        })
    );
    return;
  }

  // Navigačné requesty – Network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }

  // Statické assety – Cache first, fallback na sieť
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Cachuj nové statické súbory
        if (response.ok && response.type === 'basic') {
          const cloned = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, cloned));
        }
        return response;
      });
    })
  );
});
