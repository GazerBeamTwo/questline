/* Questline service worker: offline app shell + gentle weekly reminder. */
const VERSION = 'questline-v1.0.0';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/store.js',
  './js/templates.js',
  './js/logic.js',
  './js/ui.js',
  './js/views.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate for same-origin GETs; navigations always get the cached shell.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) => {
        const net = fetch(req).then((res) => {
          if (res.ok) caches.open(VERSION).then((c) => c.put('./index.html', res.clone()));
          return res;
        }).catch(() => cached);
        return cached || net;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      const net = fetch(req).then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});

// ---- Gentle weekly reminder (Periodic Background Sync, installed PWA on Chrome/Android) ----
function readReminder() {
  return new Promise((resolve) => {
    const r = indexedDB.open('questline', 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos');
    };
    r.onsuccess = () => {
      try {
        const tx = r.result.transaction('kv', 'readonly');
        const g = tx.objectStore('kv').get('reminder');
        g.onsuccess = () => resolve(g.result || null);
        g.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    };
    r.onerror = () => resolve(null);
  });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag !== 'questline-weekly') return;
  event.waitUntil((async () => {
    const rem = await readReminder();
    if (!rem || !rem.enabled) return;
    const sixDays = 6 * 24 * 60 * 60 * 1000;
    if (rem.lastEntryAt && Date.now() - rem.lastEntryAt < sixDays) return; // they've written recently; say nothing
    await self.registration.showNotification('What did you do this week?', {
      body: 'Any small step counts. Jot it down whenever you feel like it.',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: 'questline-weekly',
      data: { url: './#/entry/new' }
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) { c.navigate(target); return c.focus(); } }
      return self.clients.openWindow(target);
    })
  );
});
