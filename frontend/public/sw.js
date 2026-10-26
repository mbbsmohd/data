/**
 * Service Worker: ABK Data Link Enterprise Platform
 * Implements resilient persistent caching, offline fallback, and strict no-store financial security
 */

const CACHE_NAME = 'abk-data-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Sensitive endpoints that MUST NEVER be cached under any circumstances
const SENSITIVE_ENDPOINTS = [
  '/api/auth',
  '/api/wallet',
  '/api/vtu/purchase',
  '/api/withdrawal',
  '/api/admin',
  '/api/reseller',
  '/api/payment'
];

// Public endpoints eligible for stale-while-revalidate caching
const SAFE_PUBLIC_APIS = [
  '/api/settings',
  '/api/vtu/catalogue',
  '/api/vtu/plans'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Never cache non-GET requests (POST, PUT, DELETE)
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. Strict Security: Never cache sensitive authentication, financial or admin endpoints
  if (SENSITIVE_ENDPOINTS.some((endpoint) => url.pathname.startsWith(endpoint))) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            message: 'Offline: Financial actions require an active internet connection.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 3. Stale-While-Revalidate for safe public catalogue and platform settings
  if (SAFE_PUBLIC_APIS.some((endpoint) => url.pathname.startsWith(endpoint))) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 4. Cache-First for static assets (scripts, styles, fonts, images)
  if (
    url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|ico)$/) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // 5. Network-First with Cache fallback for navigational HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Default network pass-through
  event.respondWith(fetch(event.request));
});
