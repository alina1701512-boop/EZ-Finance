// ============================================================
// SERVICE WORKER — EZ Finance
// ============================================================

const CACHE_NAME = 'ez-finance-v1';
const urlsToCache = [
    '/',
    '/partners',
    '/privacy',
    '/terms',
    '/consent',
    '/css/style.css?v=1.1',
    '/js/main.js?v=1.1',
    '/favicon.svg',
    '/favicon.png'
];

// ===== УСТАНОВКА =====
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

// ===== АКТИВАЦИЯ =====
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// ===== ПЕРЕХВАТ ЗАПРОСОВ =====
self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {
                // Возвращаем из кэша или загружаем с сети
                return response || fetch(event.request);
            })
    );
});
