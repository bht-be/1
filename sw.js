/* ══════════════════════════════════════════════════════
   BHT — Service Worker
   Handles: background push notifications, offline cache
   ══════════════════════════════════════════════════════ */

const CACHE_NAME = 'bht-cache-v1';
const OFFLINE_URL = './';

// ── Install: cache the app shell ───────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ─────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  e.waitUntil(clients.claim());
});

// ── Fetch: serve from cache if offline ─────────────────
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});

// ── Push: show OS notification (vollet de raccourci) ───
self.addEventListener('push', e => {
  let data = { title: 'BHT', body: 'You have a new notification', tag: 'bht' };
  try { data = { ...data, ...e.data.json() }; } catch {}

  const icon = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
      <rect width="192" height="192" rx="40" fill="#d97706"/>
      <text x="96" y="140" font-family="Arial Black,sans-serif" font-weight="900"
            font-size="120" fill="white" text-anchor="middle">B</text>
    </svg>`
  )}`;

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || icon,
      badge: data.badge || icon,
      tag: data.tag || 'bht',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || './' }
    })
  );
});

// ── Notification click: open/focus the app ─────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      // If app already open → focus it
      for (const c of cs) {
        if (c.url.includes('bht') && 'focus' in c) return c.focus();
      }
      // Otherwise open new window
      return clients.openWindow(targetUrl);
    })
  );
});
