const CACHE_PREFIX = 'lifehub-public-';
const CACHE_NAME = CACHE_PREFIX + '__BUILD_VERSION__';
const PUBLIC_FILES = ['/offline.html', '/offline.js', '/icons/app-192.png', '/icons/app-512.png', '/icons/app-maskable-512.png', '/icons/apple-touch-icon.png'];
const APP_ROUTES = new Set(['/', '/dashboard', '/deadline', '/mon-hoc', '/tai-chinh', '/thoi-khoa-bieu', '/ho-so', '/login', '/register', '/quen-mat-khau', '/dat-lai-mat-khau']);

self.addEventListener('install', (event) => {
  // Only public assets; never store API responses, personal data or HTML from authenticated routes.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_FILES.map((url) => new Request(url, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('authorization')) return;
  if (request.mode === 'navigate' && APP_ROUTES.has(url.pathname)) {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match('/offline.html') || new Response('LifeHub cần kết nối mạng để tiếp tục.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }));
  } else if (PUBLIC_FILES.includes(url.pathname) && !url.search) {
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) => await cache.match(request) || fetch(request)));
  }
});
