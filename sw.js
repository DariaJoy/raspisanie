// Офлайн-кэш: страница открывается без интернета и сама обновляется,
// когда сеть доступна. Версию поднимать при правке списка файлов.
var CACHE = 'raspisanie-v2';
var ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

// отдаём из кэша сразу, параллельно тянем свежую версию на следующий запуск
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then(function(hit){
    var net = fetch(e.request).then(function(res){
      if (res && res.ok) caches.open(CACHE).then(function(c){ c.put(e.request, res.clone()); });
      return res;
    }).catch(function(){ return hit; });
    return hit || net;
  }));
});
