// Define the name and version of our cache. We increment the version if we change files.
const CACHE_NAME = 'life-planner-cache-v1';

// List all the files the Service Worker should save immediately when installed.
const urlsToCache = [
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json',
    '/' // Root path
    // Add icon files here if you create them later: 'icon-192.png', 'icon-512.png'
];

// --- 1. INSTALL EVENT (Caching files) ---
self.addEventListener('install', event => {
    // Wait until the promise is resolved (all files are cached)
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching App Shell assets');
                return cache.addAll(urlsToCache);
            })
    );
});

// --- 2. FETCH EVENT (Serving cached files) ---
self.addEventListener('fetch', event => {
    // Intercept network requests and check the cache first
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached asset if found
                if (response) {
                    return response;
                }
                // If not found in cache, proceed to the network
                return fetch(event.request);
            })
    );
});

// --- 3. ACTIVATE EVENT (Cleaning up old caches) ---
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    
    // Remove old caches that don't match the current CACHE_NAME
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});