// Офлайн-кэш расписания.
//
// Для самой страницы — сеть вперёд, кэш как запасной вариант: расписание
// должно быть актуальным, а страница маленькая, задержки не видно. Без сети
// отдаём последнюю сохранённую копию. Для иконок и манифеста — наоборот,
// сразу из кэша с фоновым обновлением: они меняются редко.
//
// Версию поднимать при каждой правке страницы.
var CACHE = 'raspisanie-v4';
var ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      // cache:'reload' — мимо HTTP-кэша браузера, иначе сюда ляжет
      // та же устаревшая копия, из-за которой всё и затевалось
      return c.addAll(ASSETS.map(function(u){ return new Request(u, { cache: 'reload' }); }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  var isPage = req.mode === 'navigate' || req.destination === 'document';

  if (isPage) {
    e.respondWith(
      fetch(req).then(function(res){
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){
        return caches.match(req).then(function(hit){ return hit || caches.match('./index.html'); });
      })
    );
    return;
  }

  e.respondWith(caches.match(req).then(function(hit){
    var net = fetch(req).then(function(res){
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    }).catch(function(){ return hit; });
    return hit || net;
  }));
});
