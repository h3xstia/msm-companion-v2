// __VERSION__ gets replaced on deploy so every deploy installs a new worker
const VERSION = '__VERSION__';
const SHELL = 'msm-shell-' + VERSION;
const IMAGES = 'msm-images-v1';

// network first for code + data, cache first for images and the cdn
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll([
    './', 'index.html', 'css/app.css', 'manifest.json',
    'data/islands.js', 'data/monsters.js', 'data/wubbox.js',
    'js/main.js', 'js/lib.js', 'js/util.js', 'js/data.js', 'js/store.js', 'js/ui.js', 'js/overlays.js',
    'js/breeding.js', 'js/wiki.js', 'js/sync.js', 'js/import-v1.js',
    'js/views/collection.js', 'js/views/breed.js', 'js/views/available.js', 'js/views/database.js',
    'js/views/zapping.js', 'js/views/wubbox.js', 'js/views/islands.js', 'js/views/settings.js',
  ])));
});

self.addEventListener('message', (event) => { if (event.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k.startsWith('msm-shell-') && k !== SHELL).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // don't cache wiki/supabase
  if (url.hostname.includes('supabase') || url.hostname.includes('fandom.com')) return;

  const cacheFirst = url.pathname.includes('/images/') || url.hostname === 'cdn.jsdelivr.net';
  if (cacheFirst) {
    event.respondWith(caches.open(IMAGES).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  event.respondWith(fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(SHELL).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))));
});
