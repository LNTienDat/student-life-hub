import test from 'node:test';
import assert from 'node:assert/strict';
import { getTodayClasses, getUrgentDeadlines, getDailyBudget, getDeadlineAlert, localDayKey } from '../src/pages/dashboard/todayUtils.js';

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


test('date-only deadlines expire at the end of the local day and round-trip without enabling time', async () => {
  const { deadlineToISO, deadlineInputValue, deadlineHasTime } = await import('../src/pages/deadline/deadlineDate.js');
  const iso = deadlineToISO('2028-02-29');
  const date = new Date(iso);
  assert.equal(date.getHours(), 23);
  assert.equal(date.getMinutes(), 59);
  assert.equal(date.getSeconds(), 59);
  assert.equal(date.getMilliseconds(), 999);
  assert.equal(deadlineInputValue(iso), '2028-02-29');
  assert.equal(deadlineHasTime(iso), false);
  const noon = new Date(2028, 1, 29, 12);
  assert.equal(getUrgentDeadlines([{ hanChot: iso, trangThai: 'cho_xu_ly' }], noon).overdue.length, 0);
});

test('timed deadlines including midnight and 23:59 retain their time on edit', async () => {
  const { deadlineToISO, deadlineInputValue, deadlineHasTime } = await import('../src/pages/deadline/deadlineDate.js');
  for (const time of ['00:00', '14:30', '23:59']) {
    const input = `2026-10-25T${time}`;
    const iso = deadlineToISO(input);
    assert.equal(deadlineHasTime(iso), true);
    assert.equal(deadlineInputValue(iso), input);
  }
  for (const bad of ['', '2026-02-30', '2026-10-25T24:00', '2026-10-25T', 'tomorrow']) assert.throws(() => deadlineToISO(bad));
});

test('deadline alert covers today through the third Vietnam calendar day, including date-only end of day', () => {
  const now = new Date('2026-10-25T09:00:00+07:00');
  for (let day = 25; day <= 28; day++) {
    const result = getDeadlineAlert({ trangThai: 'cho_xu_ly', hanChot: '2026-10-' + day + 'T23:59:59.999+07:00' }, now);
    assert.equal(result.kind, 'soon');
  }
  assert.equal(getDeadlineAlert({ hanChot: '2026-10-29T00:00:00+07:00' }, now), null);
});
test('overdue deadlines warn, while finished deadlines and invalid dates do not', () => {
  const now = new Date('2026-10-25T09:00:00+07:00');
  assert.equal(getDeadlineAlert({ hanChot: '2026-10-25T08:59:59+07:00' }, now).kind, 'overdue');
  assert.equal(getDeadlineAlert({ hanChot: now }, now).label, 'Đến hạn hôm nay');
  assert.equal(getDeadlineAlert({ trangThai: 'hoan_thanh', hanChot: '2026-10-24T09:00:00+07:00' }, now), null);
  assert.equal(getDeadlineAlert({ hanChot: 'invalid' }, now), null);
  assert.equal(getDeadlineAlert({ hanChot: now }, new Date('invalid')), null);
});
test('three-day warning follows Vietnam midnight and crosses month/year/leap-day boundaries', () => {
  assert.equal(getDeadlineAlert({ hanChot: '2026-10-29T00:00:00+07:00' }, new Date('2026-10-25T23:59:59+07:00')), null);
  assert.equal(getDeadlineAlert({ hanChot: '2026-10-29T00:00:00+07:00' }, new Date('2026-10-26T00:00:00+07:00')).label, 'Còn 3 ngày');
  for (const [now, due] of [
    ['2026-12-30T12:00:00+07:00', '2027-01-02T23:59:59+07:00'],
    ['2028-02-27T12:00:00+07:00', '2028-03-01T23:59:59+07:00'],
  ]) assert.equal(getDeadlineAlert({ hanChot: due }, new Date(now)).label, 'Còn 3 ngày');
});
