import test from 'node:test';
import assert from 'node:assert/strict';
import { getTodayClasses, getUrgentDeadlines, getDailyBudget, localDayKey } from '../src/pages/dashboard/todayUtils.js';

test('Sunday uses database day 8; classes change status at exact boundaries', () => {
  const classes = [
    { id: 1, thu: 8, gioBatDau: '09:00', gioKetThuc: '10:00' },
    { id: 2, thu: 8, gioBatDau: '08:00', gioKetThuc: '09:00' },
    { id: 3, thu: 2, gioBatDau: '09:00', gioKetThuc: '10:00' },
  ];
  const result = getTodayClasses(classes, new Date(2026, 9, 11, 9));
  assert.deepEqual(result.map((item) => [item.id, item.status]), [[2, 'done'], [1, 'ongoing']]);
  assert.equal(classes[0].id, 1, 'must not reorder source data');
});

test('completed deadlines and invalid dates never become urgent', () => {
  const result = getUrgentDeadlines([
    { id: 1, trangThai: 'hoan_thanh', hanChot: new Date(2026, 9, 10).toISOString() },
    { id: 2, trangThai: 'dang_dien_hanh', hanChot: 'invalid' },
  ], new Date(2026, 9, 12, 9));
  assert.equal(result.items.length, 0);
});

test('overdue work remains visible, with today and next-week tasks sorted by due date', () => {
  const now = new Date(2026, 9, 12, 9);
  const dates = [[1, 11, 8], [2, 12, 8], [3, 12, 9], [4, 19, 9], [5, 19, 10]];
  const result = getUrgentDeadlines(dates.map(([id, day, hour]) => ({
    id, trangThai: 'dang_dien_hanh', hanChot: new Date(2026, 9, day, hour).toISOString(),
  })).reverse(), now);
  assert.deepEqual(result.overdue.map((item) => item.id), [2, 1]);
  assert.deepEqual(result.dueToday.map((item) => item.id), [3]);
  assert.deepEqual(result.items.map((item) => item.id), [1, 2, 3, 4]);
});

test('today changes at local midnight rather than the UTC date boundary', () => {
  const before = new Date(2026, 9, 12, 23, 59);
  const after = new Date(2026, 9, 13, 0, 0);
  assert.notEqual(localDayKey(before), localDayKey(after));
  assert.equal(getUrgentDeadlines([{ hanChot: after.toISOString() }], before).dueToday.length, 0);
  assert.equal(getUrgentDeadlines([{ hanChot: after.toISOString() }], after).dueToday.length, 1);
});

test('last day of a leap-year February has one spending day left', () => {
  const result = getDailyBudget([{ soTienToiDa: 500000, daChi: 200000 }], new Date(2028, 1, 29));
  assert.deepEqual(result, { remaining: 300000, daysLeft: 1, perDay: 300000, exceeded: 0 });
});

test('an overspent category stays explicit and does not borrow from another budget', () => {
  const result = getDailyBudget([
    { soTienToiDa: 100000, daChi: 150000 },
    { soTienToiDa: 200000, daChi: 100000 },
  ], new Date(2026, 9, 31));
  assert.equal(result.remaining, 100000);
  assert.equal(result.exceeded, 1);
  assert.equal(getDailyBudget([], new Date()), null);
});
