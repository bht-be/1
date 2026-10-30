/* BHT service worker — put this file next to index.html (same folder). */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

/* tapping a notification: focus the open BHT tab (or open one) and tell it what to show */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var data = e.notification.data || {};
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if ('focus' in c) {
          c.postMessage({ type: 'bht-open', postId: data.postId || null, page: data.page || null });
          return c.focus();
        }
      }
      return self.clients.openWindow('./');
    })
  );
});

/* ready for real push later (needs a server): shows whatever payload it receives */
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'BHT', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'BHT', {
    body: d.body || '',
    tag: d.tag || 'bht',
    data: d.data || {}
  }));
});
