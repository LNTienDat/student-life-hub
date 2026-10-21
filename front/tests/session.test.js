import test from 'node:test';
import assert from 'node:assert/strict';
import { readSession } from '../src/services/session.js';

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
