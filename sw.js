// Service worker : met l'appli en cache pour qu'elle s'ouvre même hors ligne.
// Pensez à changer VERSION à chaque mise à jour pour forcer le rafraîchissement.
const VERSION = 'v11';
const CACHE = `mon-espace-${VERSION}`;
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/store.js',
  './js/modules.js',
  './js/pages/aujourdhui.js',
  './js/pages/bientot.js',
  './js/pages/calendrier.js',
  './js/pages/actu.js',
  './js/actu-data.js',
  './data/actu.json',
  './data/langues.json',
  './data/langues-semaine.json',
  './js/langues-data.js',
  './js/pages/langues.js',
  './js/pages/stage.js',
  './js/stage-script.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Réseau d'abord (pour avoir la dernière version), cache si hors ligne.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        if (new URL(e.request.url).origin === location.origin) {
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
