import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { createPwaClient } from '../src/pwa/client.js';

function workerHarness({ networkFails = false } = {}) {
  const handlers = {};
  const saved = new Map();
  const removed = [];
  const cache = {
    addAll: async (requests) => { for (const request of requests) saved.set(request.url, new Response('offline-fallback')); },
    match: async (request) => saved.get(typeof request === 'string' ? new URL(request, 'https://lifehub.test').href : request.url),
  };
  const self = { location: { origin: 'https://lifehub.test' }, addEventListener: (name, callback) => { handlers[name] = callback; }, clients: { claim: async () => {} }, skipWaiting: () => { self.skipped = true; } };
  class WorkerRequest extends Request { constructor(url, options) { super(new URL(url, self.location.origin), options); } }
  vm.runInNewContext(readFileSync(new URL('../pwa/service-worker.js', import.meta.url), 'utf8'), {
    self, URL, Request: WorkerRequest, Response,
    caches: { open: async () => cache, keys: async () => ['lifehub-public-old', 'unrelated-app'], delete: async (key) => removed.push(key) },
    fetch: async () => { if (networkFails) throw new Error('offline'); return new Response('network'); },
  });
  async function dispatch(name, properties = {}) {
    let work;
    handlers[name]({ ...properties, waitUntil: (promise) => { work = promise; }, respondWith: (promise) => { work = promise; } });
    return work;
  }
  return { self, saved, removed, dispatch };
}
test('service worker stores public fallback assets only and leaves API, authenticated, external and write requests untouched', async () => {
  const worker = workerHarness();
  await worker.dispatch('install');
  assert.equal(worker.saved.size, 6);
  assert.ok([...worker.saved.keys()].every((url) => /\/(icons\/[^/]+\.png|offline\.(html|js))$/.test(url)));
  for (const request of [
    { url: 'https://lifehub.test/api/academic/gpa', method: 'GET', headers: new Headers(), mode: 'cors' },
    { url: 'https://lifehub.test/dashboard', method: 'GET', headers: new Headers({ authorization: 'Bearer private' }), mode: 'navigate' },
    { url: 'https://other.test/dashboard', method: 'GET', headers: new Headers(), mode: 'navigate' },
    { url: 'https://lifehub.test/api/deadline', method: 'POST', headers: new Headers(), mode: 'cors' },
    { url: 'https://lifehub.test/tests/ui-preview.html', method: 'GET', headers: new Headers(), mode: 'navigate' },
    { url: 'https://lifehub.test/assets/app.js', method: 'GET', headers: new Headers(), mode: 'cors' },
  ]) assert.equal(await worker.dispatch('fetch', { request }), undefined);
});
test('offline deep links receive fallback; online navigations never write private responses to cache', async () => {
  const offline = workerHarness({ networkFails: true });
  await offline.dispatch('install');
  const request = { url: 'https://lifehub.test/deadline?private=123', method: 'GET', headers: new Headers(), mode: 'navigate' };
  assert.equal(await (await offline.dispatch('fetch', { request })).text(), 'offline-fallback');
  assert.equal(offline.saved.size, 6);
  const online = workerHarness();
  await online.dispatch('install');
  assert.equal(await (await online.dispatch('fetch', { request })).text(), 'network');
  assert.equal(online.saved.size, 6);
});
test('worker update only activates on user action and cleans only its own caches', async () => {
  const worker = workerHarness();
  await worker.dispatch('install');
  assert.equal(worker.self.skipped, undefined);
  await worker.dispatch('message', { data: { type: 'ACTIVATE_UPDATE' } });
  assert.equal(worker.self.skipped, true);
  await worker.dispatch('activate');
  assert.deepEqual(worker.removed, ['lifehub-public-old']);
});

function browserHarness({ enabled = true, secure = true } = {}) {
  const window = Object.assign(new EventTarget(), { isSecureContext: secure, location: { reload: () => { window.reloads++; } }, reloads: 0 });
  const media = Object.assign(new EventTarget(), { matches: false });
  window.matchMedia = () => media;
  const waiting = { postMessage: (message) => { waiting.message = message; } };
  const registration = Object.assign(new EventTarget(), { waiting, update: async () => {} });
  const serviceWorker = Object.assign(new EventTarget(), { register: async () => registration });
  const navigator = { onLine: true, serviceWorker };
  return { window, media, registration, serviceWorker, client: createPwaClient({ window, navigator, enabled }) };
}
test('install prompt is consumed once; update reload needs an explicit user request', async () => {
  const { window, client, serviceWorker } = browserHarness();
  client.start(); await Promise.resolve();
  let prompts = 0;
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt: async () => { prompts++; }, userChoice: Promise.resolve({ outcome: 'accepted' }) });
  window.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(client.getSnapshot().canInstall, true);
  assert.equal(await client.install(), 'accepted');
  assert.equal(await client.install(), 'unavailable');
  assert.equal(prompts, 1);
  serviceWorker.dispatchEvent(new Event('controllerchange'));
  assert.equal(window.reloads, 0);
  assert.equal(client.applyUpdate(), true);
  serviceWorker.dispatchEvent(new Event('controllerchange'));
  assert.equal(window.reloads, 1);
  window.dispatchEvent(new Event('appinstalled'));
  assert.equal(client.getSnapshot().installed, true);
  client.dispose();
});
test('network status updates and subscriptions clean up; dev and insecure origins do not register workers', async () => {
  const { client, window } = browserHarness({ enabled: false });
  let changes = 0;
  client.subscribe(() => changes++); client.start(); client.start();
  window.dispatchEvent(new Event('offline'));
  assert.equal(client.getSnapshot().online, false);
  window.dispatchEvent(new Event('online'));
  assert.equal(client.getSnapshot().online, true);
  assert.equal(changes, 2);
  assert.equal(client.applyUpdate(), false);
  client.dispose(); window.dispatchEvent(new Event('offline'));
  assert.equal(changes, 2);
  const insecure = browserHarness({ secure: false });
  insecure.client.start(); await Promise.resolve();
  assert.equal(insecure.client.applyUpdate(), false);
  insecure.client.dispose();
});
test('an already-installing worker is observed without missing the updatefound event', async () => {
  const { client, registration, serviceWorker } = browserHarness();
  registration.waiting = null;
  registration.installing = Object.assign(new EventTarget(), { state: 'installing' });
  serviceWorker.controller = {};
  client.start(); await Promise.resolve();
  assert.equal(client.getSnapshot().updateReady, false);
  registration.installing.state = 'installed';
  registration.installing.dispatchEvent(new Event('statechange'));
  assert.equal(client.getSnapshot().updateReady, true);
  client.dispose();
});
test('manifest icons exist at declared PNG sizes; production bundle contains a versioned worker', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.start_url, '/dashboard');
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const buffer = readFileSync(new URL(`../public${icon.src}`, import.meta.url));
    assert.equal(`${buffer.readUInt32BE(16)}x${buffer.readUInt32BE(20)}`, icon.sizes);
  }
  assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable'));
  const dist = new URL('../dist/sw.js', import.meta.url);
  assert.ok(existsSync(dist), 'Run npm run build before this test.');
  assert.ok(!readFileSync(dist, 'utf8').includes('__BUILD_VERSION__'));
});
