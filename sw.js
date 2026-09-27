const CACHE = 'glouglou-v1';
const ASSETS = [
  './', 'index.html', 'style.css', 'app.js', 'config.js', 'manifest.webmanifest',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord (pour recevoir tes mises à jour), cache si hors ligne.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Petite gorgée ? 💧', {
      body: data.body || 'Touche la notification une fois ton verre bu 💦',
      icon: 'icons/icon-192.png',
      tag: 'glouglou',
      data: { url: './?drink=1' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (all.length > 0) {
      const client = all[0];
      await client.focus();
      client.postMessage({ type: 'drink' });
    } else {
      await self.clients.openWindow(event.notification.data.url);
    }
  })());
});
