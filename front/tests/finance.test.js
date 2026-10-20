import process from 'node:process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { transactionQuery, financeSummary, localDateInput } from '../src/pages/taichinh/financeUtils.js';

test('finance filters use the API search, page and month contract', () => {
  assert.deepEqual(transactionQuery({
    timKiem: '  sách  ', locLoai: 'chi', locDanhMuc: 'khac',
    chiThangNay: true, thang: 10, nam: 2026,
  }, 3), { trang: 3, soLuong: 10, q: 'sách', loai: 'chi', danhMuc: 'khac', thang: 10, nam: 2026 });
  assert.deepEqual(transactionQuery({ chiThangNay: false, thang: 10, nam: 2026 }), { trang: 1, soLuong: 10 });
});

test('a finance refresh preserves API budgets and refreshes trends with totals', () => {
  const budget = { id: 1, danhMuc: 'an_uong', soTienToiDa: 1000000, daChi: 80000 };
  const trend = { thang: 'T10/26', thu: 0, chi: 80000 };
  assert.deepEqual(financeSummary({ tongChi: 80000 }, { ketQua: [budget] }, { xuHuong: [trend] }), {
    thongKe: { tongChi: 80000 }, nganSachs: [budget], xuHuong: [trend],
  });
});

test('finance date input follows the local calendar before the UTC day changes', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'Asia/Bangkok';
  try {
    const date = new Date('2026-10-19T17:30:00.000Z');
    assert.equal(date.toISOString().slice(0, 10), '2026-10-19');
    assert.equal(localDateInput(date), '2026-10-20');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
