const CACHE_NAME = 'mellchat-v1.0.0';
const RUNTIME_CACHE = 'mellchat-runtime';

// Assets to cache on install (only essential files)
const PRECACHE_URLS = [
  '/',
  '/manifest.json'
];

// Install - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Precaching app shell');
        // Cache files individually to handle failures gracefully
        return Promise.allSettled(
          PRECACHE_URLS.map(url => 
            cache.add(url).catch(error => {
              console.warn(`Failed to cache ${url}:`, error);
              return null; // Continue with other files
            })
          )
        );
      })
      .then(() => {
        console.log('✅ App shell precached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker install failed:', error);
        return self.skipWaiting(); // Still activate even if caching fails
      })
  );
});

// Activate - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map(name => {
              console.log('🗑️ Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests from caching
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline', offline: true }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Network first strategy for HTML
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(cachedResponse => {
              return cachedResponse || caches.match('/index.html');
            });
        })
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(response => {
            // Don't cache non-OK responses
            if (!response || response.status !== 200) {
              return response;
            }

            const clonedResponse = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, clonedResponse);
            });

            return response;
          });
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-upvotes') {
    event.waitUntil(syncUpvotes());
  }
});

async function syncUpvotes() {
  // Sync queued upvotes when back online
  const cache = await caches.open('upvote-queue');
  const requests = await cache.keys();
  
  return Promise.all(
    requests.map(async request => {
      try {
        await fetch(request.clone());
        await cache.delete(request);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    })
  );
}

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Нове повідомлення від MellChat',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'mellchat-notification',
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Відкрити' },
      { action: 'close', title: 'Закрити' }
    ],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MellChat', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Focus existing window if available
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Skip Waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});