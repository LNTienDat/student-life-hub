const request = require('supertest');
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { mountFrontend } = require('../../src/serveFrontend');

const dist = path.resolve(__dirname, '../../../front/dist');
const app = express();
app.use(helmet());
app.get('/api/example', (req, res) => res.json({ ok: true }));
mountFrontend(app, dist);
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

test('combined service serves the SPA on root and deep links while preserving API responses', async () => {
  for (const route of ['/', '/dashboard', '/deadline', '/dat-lai-mat-khau?token=example']) {
    const response = await request(app).get(route);
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('manifest.webmanifest');
    expect(response.headers['cache-control']).toContain('no-cache');
  }
  expect((await request(app).get('/api/example')).body).toEqual({ ok: true });
});
test('missing files and unknown APIs do not fall back to HTML; source files cannot be downloaded', async () => {
  for (const route of ['/sw-missing.js', '/assets/missing.js', '/icons/missing.png', '/.env', '/api/missing']) {
    const response = await request(app).get(route);
    expect(response.status).toBe(404);
    expect(response.headers['content-type']).not.toContain('text/html');
  }
});
test('worker can update; hashed bundles are immutable; scripts comply with self-only CSP', async () => {
  const sw = await request(app).get('/sw.js');
  expect(sw.status).toBe(200);
  expect(sw.headers['cache-control']).toContain('no-store');
  expect(sw.headers['service-worker-allowed']).toBe('/');
  const name = fs.readdirSync(path.join(dist, 'assets')).find((file) => file.endsWith('.js'));
  expect((await request(app).get(`/assets/${name}`)).headers['cache-control']).toContain('immutable');
  const html = await request(app).get('/');
  expect(html.headers['content-security-policy']).toContain("script-src 'self'");
  expect(html.text).toContain('/theme-init.js');
  expect(html.text).not.toMatch(/<script>([\s\S]*?)<\/script>/);
  const offline = await request(app).get('/offline.html');
  expect(offline.text).toContain('/offline.js');
  expect(offline.text).not.toMatch(/<script>([\s\S]*?)<\/script>/);
  expect((await request(app).get('/offline.js')).status).toBe(200);
  expect((await request(app).get('/theme-init.js')).status).toBe(200);
});
