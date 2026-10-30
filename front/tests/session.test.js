import test from 'node:test';
import assert from 'node:assert/strict';
import { readSession, subscribeSessionChanges } from '../src/services/session.js';

function storage(user, payload) {
  const token = `header.${btoa(JSON.stringify(payload))}.signature`;
  return { getItem: key => key === 'user' ? JSON.stringify(user) : token };
}
test('restoring a session requires an unexpired JWT and the matching user', () => {
  const user = { id: 7, ten: 'QA' };
  assert.deepEqual(readSession(storage(user, { id: 7, exp: 20 }), 10000), user);
  assert.equal(readSession(storage(user, { id: 8, exp: 20 }), 10000), null);
  assert.equal(readSession(storage(user, { id: 7, exp: 10 }), 10000), null);
  assert.equal(readSession(storage(user, { id: 7 }), 10000), null);
});
test('corrupt storage, missing token and invalid user IDs do not open private pages', () => {
  assert.equal(readSession({ getItem: () => null }), null);
  assert.equal(readSession({ getItem: () => '{broken' }), null);
  assert.equal(readSession(storage({ id: '7' }, { id: 7, exp: 20 }), 10000), null);
  assert.equal(readSession({ getItem: () => { throw new Error('Storage unavailable'); } }), null);
});

test('cross-tab login waits for the user commit; logout and clearing storage invalidate immediately', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null };
  const target = new EventTarget();
  const states = [];
  const stop = subscribeSessionChanges(storage, target, value => states.push(value));
  const emit = (key, newValue) => target.dispatchEvent(Object.assign(new Event('storage'), { key, newValue }));
  const token = id => 'header.' + btoa(JSON.stringify({ id, exp: Date.now() / 1000 + 600 })) + '.signature';
  const a = { id: 1 }, b = { id: 2 };
  values.set('token', token(1)); values.set('user', JSON.stringify(a));
  values.set('token', token(2)); emit('token', values.get('token'));
  assert.deepEqual(states, []);
  values.set('user', JSON.stringify(b)); emit('user', values.get('user'));
  assert.deepEqual(states, [b]);
  values.delete('token'); emit('token', null);
  assert.deepEqual(states, [b, null]);
  values.clear(); emit(null, null);
  assert.deepEqual(states, [b, null, null]);
  stop(); emit('user', null);
  assert.equal(states.length, 3);
});
