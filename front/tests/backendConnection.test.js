import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createBackendConnection } from '../src/services/backendConnection.js';
import { createApiClient } from '../src/services/apiClient.js';
function fakeGate(extra = {}) {
  let clock = 0;
  return createBackendConnection({ now: () => clock, delay: async ms => { clock += ms; }, pollMs: 2, maxWaitMs: 10, ...extra });
}
const connection = (probe = async () => {}) => ({ enabled: true, ensureReady: probe, confirmReady() {}, markUnavailable() {} });
const response = (config, data = {}, headers = {}) => ({ config, data, headers, status: 200, statusText: 'OK' });
test('parallel callers share one probe; fresh connections have no background polling', async () => {
  let probes = 0, release;
  const gate = fakeGate({ probe: () => { probes++; return new Promise(r => { release = r; }); } });
  const a = gate.ensureReady(), b = gate.ensureReady();
  assert.equal(a, b); assert.equal(probes, 1);
  release(true); await a; await gate.ensureReady();
  assert.equal(probes, 1); assert.equal(gate.getSnapshot().status, 'ready');
});
test('unready probes recover and persistently unavailable probes stop at the deadline', async () => {
  let probes = 0;
  const gate = fakeGate({ probe: async () => ++probes === 3 });
  await gate.ensureReady(); assert.equal(probes, 3);
  const down = fakeGate({ probe: async () => false });
  await assert.rejects(down.ensureReady(), { code: 'ERR_BACKEND_UNAVAILABLE' });
  assert.equal(down.getSnapshot().status, 'error');
});
test('hung probes time out and explicit retry can reconnect', async () => {
  let up = false;
  const gate = createBackendConnection({ maxWaitMs: 15, probeTimeoutMs: 5, pollMs: 1, probe: () => up ? Promise.resolve(true) : new Promise(() => {}) });
  await assert.rejects(gate.ensureReady(), { code: 'ERR_BACKEND_UNAVAILABLE' });
  up = true; await gate.retry(); assert.equal(gate.getSnapshot().status, 'ready');
});
test('offline and disabled gates do not probe; reconnecting allows retry', async () => {
  let online = false, probes = 0;
  const gate = fakeGate({ online: () => online, probe: async () => { probes++; return true; } });
  await assert.rejects(gate.ensureReady()); assert.equal(probes, 0);
  online = true; await gate.retry(); assert.equal(probes, 1);
  await fakeGate({ enabled: false, probe: () => { throw new Error('Must not probe'); } }).ensureReady();
});
test('an expired readiness lease is checked only on the next request', async () => {
  let now = 0, probes = 0;
  const gate = createBackendConnection({ now: () => now, freshMs: 10, probe: async () => { probes++; return true; } });
  await gate.ensureReady(); now = 11; assert.equal(probes, 1);
  await gate.ensureReady(); assert.equal(probes, 2);
});
test('a write waits for readiness and sends exactly once', async () => {
  let release, sent = 0;
  const api = createApiClient({ connection: connection(() => new Promise(r => { release = r; })) });
  api.defaults.adapter = async config => { sent++; return response(config); };
  const pending = api.post('/auth/dang-nhap', { email: 'test@example.invalid' });
  await new Promise(r => setTimeout(r, 0)); assert.equal(sent, 0);
  release(); await pending; assert.equal(sent, 1);
});
test('GET retries a Render HTML response once and never exposes HTML as application data', async () => {
  let sent = 0, forced = 0;
  const api = createApiClient({ connection: connection(async force => { if (force) forced++; }) });
  api.defaults.adapter = async config => ++sent === 1 ? response(config, '<html>Render waking</html>', { 'content-type': 'text/html' }) : response(config, { ok: true });
  assert.deepEqual((await api.get('/academic/gpa')).data, { ok: true });
  assert.equal(sent, 2); assert.equal(forced, 1);
  api.defaults.adapter = async config => response(config, '<html>still waking</html>', { 'content-type': 'text/html' });
  await assert.rejects(api.get('/academic/gpa'), /Chưa tải được dữ liệu/);
});
test('POST PUT PATCH DELETE are never replayed after a lost response', async () => {
  for (const method of ['post', 'put', 'patch', 'delete']) {
    let sent = 0, forced = 0;
    const api = createApiClient({ connection: connection(async force => { if (force) forced++; }) });
    api.defaults.adapter = async config => { sent++; throw new axios.AxiosError('Lost response', 'ERR_NETWORK', config); };
    await assert.rejects(api.request({ method, url: '/deadline/1' }), /Chưa xác nhận thao tác đã được lưu/);
    assert.equal(sent, 1); assert.equal(forced, 0);
  }
});
test('readiness failure sends no business request and returns a non-authentication error', async () => {
  let sent = 0;
  const api = createApiClient({ connection: connection(async () => { const e = new Error('Backend down'); e.code = 'ERR_BACKEND_UNAVAILABLE'; throw e; }) });
  api.defaults.adapter = async config => { sent++; return response(config); };
  await assert.rejects(api.post('/auth/dang-nhap', {}), e => e.response.status === 503);
  assert.equal(sent, 0);
});
test('business errors and canceled writes do not trigger cold-start retries', async () => {
  let forced = 0;
  const api = createApiClient({ connection: connection(async force => { if (force) forced++; }) });
  api.defaults.adapter = async config => { throw new axios.AxiosError('Mail unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: { message: 'Mail unavailable' } }); };
  await assert.rejects(api.post('/auth/quen-mat-khau'), e => e.response.data.message === 'Mail unavailable');
  const abort = new AbortController(); abort.abort();
  await assert.rejects(api.post('/deadline', {}, { signal: abort.signal }), e => axios.isCancel(e));
  assert.equal(forced, 0);
});

test('permission errors preserve the session while revoked authentication clears it', async () => {
  const previousWindow=globalThis.window, previousStorage=globalThis.localStorage;
  const removed=[];
  try {
    globalThis.window={location:{pathname:'/dashboard',href:'/dashboard'},navigator:{onLine:true}};
    globalThis.localStorage={getItem:()=> 'test-token',removeItem:key=>removed.push(key)};
    const api=createApiClient({connection:connection()});
    let code='PERMISSION_DENIED';
    api.defaults.adapter=async config=>{throw new axios.AxiosError('Forbidden','ERR_BAD_RESPONSE',config,null,{status:403,data:{code},config});};
    await assert.rejects(api.get('/nhom/1'));
    assert.deepEqual(removed,[]); assert.equal(window.location.href,'/dashboard');
    code='AUTH_INVALID'; await assert.rejects(api.get('/auth/ho-so'));
    assert.deepEqual(removed,['token','user']); assert.equal(window.location.href,'/login');
  } finally {
    if(previousWindow===undefined) delete globalThis.window; else globalThis.window=previousWindow;
    if(previousStorage===undefined) delete globalThis.localStorage; else globalThis.localStorage=previousStorage;
  }
});
test('HTML returned to a write is rejected and never retried as if it were a successful save', async () => {
  let writes=0;
  const api=createApiClient({connection:connection()});
  api.defaults.adapter=async config=>{writes++;return response(config,'<html>Render waking</html>',{'content-type':'text/html'});};
  await assert.rejects(api.post('/deadline',{}),/Chưa xác nhận thao tác đã được lưu/);
  assert.equal(writes,1);
});
