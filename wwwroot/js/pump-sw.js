/* =============================================================
   pump-sw.js  —  Service Worker for PWA installability
   Provides minimal offline shell caching.
   ============================================================= */

var CACHE_NAME = 'lubelogger-pump-v1';
var SHELL_URLS = [
    '/Vehicle/QuickFuel',
    '/css/pump-ui.css',
    '/js/pump-ui.js',
    '/js/pump-nav.js',
    '/defaults/lubelogger_icon_128.png'
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(SHELL_URLS);
        }).catch(function () { /* silent — shell caching is best-effort */ })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) { return k !== CACHE_NAME; })
                    .map(function (k) { return caches.delete(k); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (e) {
    var url = e.request.url;
    // Network-first for API calls and dynamic pages
    if (url.includes('/Vehicle/') || url.includes('/Home/') || url.includes('/api/')) {
        e.respondWith(
            fetch(e.request).catch(function () {
                return caches.match(e.request);
            })
        );
        return;
    }
    // Cache-first for static assets
    e.respondWith(
        caches.match(e.request).then(function (cached) {
            return cached || fetch(e.request).then(function (resp) {
                var clone = resp.clone();
                caches.open(CACHE_NAME).then(function (c) { c.put(e.request, clone); });
                return resp;
            });
        })
    );
});
