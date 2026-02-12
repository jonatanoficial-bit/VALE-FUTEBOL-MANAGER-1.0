/* VFM 2026 - Service Worker (cache básico)
   Objetivo: melhorar carregamento no GitHub Pages e permitir modo offline.
*/

const CACHE_NAME = 'vfm-2026-cache-v1.31.1';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './favicon.ico',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k.startsWith('vfm-2026-cache-') && k !== CACHE_NAME).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Network-first para dados JSON (atualizações de pacote)
  if (req.url.includes('/data/') || req.url.endsWith('.json')) {
    event.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first para assets estáticos
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
      return res;
    }))
  );
});
