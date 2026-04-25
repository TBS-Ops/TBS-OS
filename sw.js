const CACHE_NAME = 'tbs-os-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // Never intercept Firebase, Google APIs, or chrome-extension requests
  if (url.includes('firebase') || 
      url.includes('firestore') || 
      url.includes('googleapis') || 
      url.includes('gstatic') ||
      url.startsWith('chrome-extension')) {
    return;
  }
  
  // Only cache same-origin requests with http/https
  if (!url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            try { cache.put(event.request, clone); } catch(e) {}
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
