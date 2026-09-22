// sw.js — 萬年曆離線快取。瀏覽器限制 Service Worker 只能在安全來源(https/localhost)註冊，
// 用 file:// 直接開啟 index.html 時註冊會失敗，index.html 裡已經用 try/catch 吞掉這個失敗、
// 不影響直接開檔案的主要用法；部署到靜態網站(如 GitHub Pages)時才會真的生效。
const CACHE_NAME = 'koi-almanac-v7';
const CORE_ASSETS = [
  'index.html',
  'calendar-lexicon.js',
  'manifest.json',
  'icon.svg',
  'https://cdn.jsdelivr.net/npm/lunar-javascript@1.7.7/lunar.js',
  'https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/cn2t.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* stale-while-revalidate: 有快取先秒開，背景仍嘗試更新快取；離線時退回快取 */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
