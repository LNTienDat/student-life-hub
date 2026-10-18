import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { preview } from 'vite';

const api = createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ path: request.url, ok: true }));
});
let app;
try {
  await new Promise((resolve, reject) => { api.once('error', reject); api.listen(0, '127.0.0.1', resolve); });
  app = await preview({ preview: { host: '127.0.0.1', port: 0, open: false, proxy: { '/api': { target: `http://127.0.0.1:${api.address().port}`, changeOrigin: true } } } });
  const origin = `http://127.0.0.1:${app.httpServer.address().port}`;
  const manifestResponse = await fetch(`${origin}/manifest.webmanifest`);
  assert.equal(manifestResponse.status, 200);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const response = await fetch(new URL(icon.src, origin));
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').includes('image/png'));
  }
  const worker = await fetch(`${origin}/sw.js`);
  assert.ok(worker.headers.get('content-type').includes('javascript'));
  assert.ok(!(await worker.text()).includes('__BUILD_VERSION__'));
  const offline = await fetch(`${origin}/offline.html`);
  assert.ok((await offline.text()).includes('Chưa có kết nối mạng'));
  const deepLink = await fetch(`${origin}/deadline`);
  assert.ok((await deepLink.text()).includes('manifest.webmanifest'));
  const proxy = await fetch(`${origin}/api/health`);
  assert.deepEqual(await proxy.json(), { path: '/api/health', ok: true });
  console.log('PASS: built manifest, icons, worker, offline page, SPA deep links and same-origin API proxy.');
} finally {
  if (app) { app.httpServer.closeAllConnections(); await new Promise((resolve) => app.httpServer.close(resolve)); }
  api.closeAllConnections();
  if (api.listening) await new Promise((resolve) => api.close(resolve));
}
