const express = require('express');
const cors = require('cors');
const request = require('supertest');
const { corsOrigins } = require('../../src/corsOrigins');
test('exact old and static frontend origins can coexist without broad wildcards', () => {
  expect(corsOrigins({ FRONTEND_URL: 'https://old.example/', RENDER_EXTERNAL_URL: 'https://api.example', ADDITIONAL_FRONTEND_URLS: 'https://web.example, https://web.example/' })).toEqual(['https://old.example', 'https://api.example', 'https://web.example']);
  expect(corsOrigins({})).toEqual(['http://localhost:5173']);
});
test('production rejects insecure, wildcard, credential-bearing and non-origin URLs', () => {
  for (const value of ['http://web.example', 'https://*.example', 'https://web.example/path', 'https://web.example?x=1', 'https://user:secret@web.example']) expect(() => corsOrigins({ NODE_ENV: 'production', FRONTEND_URL: value })).toThrow();
});
test('cross-origin Authorization preflight allows only the configured frontend', async () => {
  const app = express(); app.use(cors({ origin: corsOrigins({ FRONTEND_URL: 'https://web.example' }), credentials: true }));
  app.post('/api/example', (req, res) => res.json({ ok: true }));
  const allowed = await request(app).options('/api/example').set('Origin', 'https://web.example').set('Access-Control-Request-Method', 'POST').set('Access-Control-Request-Headers', 'authorization,content-type');
  expect(allowed.status).toBe(204); expect(allowed.headers['access-control-allow-origin']).toBe('https://web.example');
  expect(allowed.headers['access-control-allow-headers']).toContain('authorization');
  const denied = await request(app).options('/api/example').set('Origin', 'https://other.example').set('Access-Control-Request-Method', 'POST');
  expect(denied.headers['access-control-allow-origin']).toBeUndefined();
});
