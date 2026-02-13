/* VFM 2026 - Service Worker (cache básico)
   Objetivo: melhorar carregamento no GitHub Pages e permitir modo offline.
*/

const CACHE_NAME = 'vfm-2026-cache-v1.34.1_hotfix_cont_staff_tactics-2026-02-13_171640';
const CORE_ASSETS = [
  './',
  ''./styles.css?v=build_2026-02-13_171640_v1.34.1_hotfix_cont_staff_tactics',
  './manifest.json',
  './favicon.ico'
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

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Sempre tentar a rede primeiro para HTML/navegação e JS principal (evita ficar preso em versões antigas)
  const isNav = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  const isCritical =
    isNav ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/app.js') ||
    url.pathname.endsWith('/app.bundle.js') ||
    url.pathname.endsWith('/sw.js');

  if (isSameOrigin && isCritical) {
    event.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      }).catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Network-first para JSON/dados
  if (isSameOrigin && (url.pathname.includes('/data/') || url.pathname.endsWith('.json'))) {
    event.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first para assets estáticos (com revalidação simples)
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});