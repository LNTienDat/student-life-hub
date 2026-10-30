import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDeadlines } from '../src/pages/deadline/deadlineUtils.js';

const task = (id, doUuTien, hanChot, trangThai = 'cho_xu_ly') => ({ id, doUuTien, hanChot, trangThai });

test('deadline importance outranks due date; equal importance uses earliest due date and completed work stays last', () => {
  const input = [
    task(1, 'thap', '2026-10-20T00:00:00Z'),
    task(2, 'binh_thuong', '2026-10-21T00:00:00Z'),
    task(3, 'cao', '2026-11-01T00:00:00Z'),
    task(4, 'cao', '2026-10-31T00:00:00Z'),
    task(5, 'cao', '2026-10-01T00:00:00Z', 'hoan_thanh'),
  ];
  assert.deepEqual(selectDeadlines(input).map(item => item.id), [4, 3, 2, 1, 5]);
});

test('each priority filter includes only that priority without losing its pending/completed state', () => {
  const items = [task(1, 'thap', '2026-10-26'), task(2, 'binh_thuong', '2026-10-26'), task(3, 'cao', '2026-10-26'), task(4, 'cao', '2026-10-26', 'hoan_thanh')];
  assert.deepEqual(selectDeadlines(items, 'cao').map(item => item.id), [3, 4]);
  assert.deepEqual(selectDeadlines(items, 'binh_thuong').map(item => item.id), [2]);
  assert.deepEqual(selectDeadlines(items, 'thap').map(item => item.id), [1]);
  assert.deepEqual(selectDeadlines([items[0]], 'cao'), []);
  assert.equal(selectDeadlines(items, 'all').length, 4);
  assert.equal(selectDeadlines(items, 'invalid-filter').length, 4);
});

test('sorting and filtering never mutate shared response arrays or deadline objects', () => {
  const first = Object.freeze(task(1, 'thap', '2026-10-26'));
  const second = Object.freeze(task(2, 'cao', '2026-10-27'));
  const input = Object.freeze([first, second]);
  assert.deepEqual(selectDeadlines(input).map(item => item.id), [2, 1]);
  assert.deepEqual(selectDeadlines(input, 'cao'), [second]);
  assert.deepEqual(input.map(item => item.id), [1, 2]);
});

test('same-time ties have stable numeric IDs; invalid dates sort last within importance', () => {
  const input = [task(10, 'cao', '2026-10-26'), task(2, 'cao', '2026-10-26'), task(1, 'cao', 'invalid'), task(3, 'cao', null), task(4, undefined, '2026-10-25')];
  assert.deepEqual(selectDeadlines(input).map(item => item.id), [2, 10, 1, 3, 4]);
  assert.deepEqual(selectDeadlines(input, 'binh_thuong').map(item => item.id), [4]);
  assert.deepEqual(selectDeadlines([]), []);
});

import { defaultDeadlineDate, deadlineCountdown } from '../src/pages/deadline/deadlineDate.js';
test('countdown uses Vietnam calendar days, handles overdue timed work today and year changes',()=>{
  const now='2026-10-27T05:00:00Z';
  assert.equal(deadlineCountdown('2026-10-26T16:59:59.999Z',now),'Quá 1 ngày');
  assert.equal(deadlineCountdown('2026-10-27T16:59:59.999Z',now),'Hôm nay');
  assert.equal(deadlineCountdown('2026-10-27T04:00:00Z',now),'Đã quá hạn');
  assert.equal(deadlineCountdown('2026-11-06T16:59:59.999Z',now),'Còn 10 ngày');
  assert.equal(defaultDeadlineDate(new Date('2026-12-31T18:00:00Z')),'2027-01-01');
  assert.equal(deadlineCountdown('bad',now),'');
});

// Completion cleanup is an elapsed 24-hour interval, independent of due date/timezone.
import { completionCountdown } from '../src/pages/deadline/completionTime.js';
test('completion countdown persists its server timestamp and handles exact expiry', () => {
  const start = Date.parse('2026-10-30T10:00:00Z');
  const item = { hoanThanhLuc: new Date(start).toISOString() };
  assert.equal(completionCountdown(item, start), 'Xóa sau 24h 0p');
  assert.equal(completionCountdown(item, start + 60000), 'Xóa sau 23h 59p');
  assert.equal(completionCountdown(item, start + 86400000), 'Đang chuyển vào Đã xóa…');
  assert.equal(completionCountdown({}, start), '');
});
