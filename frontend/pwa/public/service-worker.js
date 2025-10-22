// MellChat Service Worker - v2.0.0 (Material Design Update)
const CACHE_NAME = 'mellchat-v2';
const DEBUG = true;

// Мінімальний список для кешування - тільки те, що точно існує
const ESSENTIAL_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Логування з префіксом
const log = (...args) => DEBUG && console.log('[SW]', ...args);

// Install - кешуємо тільки основні файли
self.addEventListener('install', (event) => {
  log('📦 Installing Service Worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        log('📦 Caching essential files');
        // Кешуємо файли по одному для кращої обробки помилок
        return Promise.allSettled(
          ESSENTIAL_CACHE.map(url => 
            cache.add(url).catch(error => {
              log(`⚠️ Failed to cache ${url}:`, error);
              return null; // Продовжуємо з іншими файлами
            })
          )
        );
      })
      .then(() => {
        log('✅ Essential files cached');
        return self.skipWaiting(); // Негайна активація
      })
      .catch(error => {
        log('❌ Install failed:', error);
        return self.skipWaiting(); // Все одно активуємо
      })
  );
});

// Activate - очищаємо старі кеші
self.addEventListener('activate', (event) => {
  log('🚀 Activating Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        log('✅ Service Worker activated');
        return self.clients.claim(); // Негайний контроль клієнтів
      })
  );
});

// Fetch - стратегія кешування
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Тільки для нашого домену
  if (url.origin !== location.origin) {
    return; // Пропускаємо зовнішні запити
  }
  
  // Стратегія: Cache First для статичних ресурсів
  if (request.destination === 'document' || 
      request.destination === 'manifest' ||
      url.pathname === '/' ||
      url.pathname === '/index.html' ||
      url.pathname === '/manifest.json') {
    
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            log('📦 Serving from cache:', url.pathname);
            return response;
          }
          
          log('🌐 Fetching from network:', url.pathname);
          return fetch(request)
            .then(response => {
              // Кешуємо тільки успішні відповіді
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(request, responseClone));
              }
              return response;
            })
            .catch(error => {
              log('❌ Network fetch failed:', error);
              // Fallback для HTML
              if (request.destination === 'document') {
                return caches.match('/index.html');
              }
              throw error;
            });
        })
    );
  }
  
  // Для API запитів - Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(error => {
          log('❌ API request failed:', error);
          throw error;
        })
    );
  }
});

// Обробка повідомлень від основного потоку
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      log('🔄 Skipping waiting...');
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      log('🗑️ Clearing cache...');
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      log('❓ Unknown message type:', type);
  }
});

log('🎯 Service Worker script loaded');