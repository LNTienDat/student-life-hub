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


test('money entry groups digits while preserving the exact amount sent to the API', async () => {
  const { moneyDigits, formatMoneyInput } = await import('../src/utils/moneyInput.js');
  for (const amount of ['', '1', '100000', '1500000', '999999999999']) {
    const displayed = formatMoneyInput(amount);
    assert.equal(moneyDigits(displayed), amount);
    if (amount) assert.equal(Number(moneyDigits(displayed)), Number(amount));
  }
  assert.equal(formatMoneyInput('100000'), '100 000');
  assert.equal(formatMoneyInput('1500000'), '1 500 000');
  assert.equal(moneyDigits('100\u00a0000'), '100000');
});

test('money entry rejects negative, decimal, exponential and nonnumeric values rather than changing their meaning', async () => {
  const { moneyDigits } = await import('../src/utils/moneyInput.js');
  for (const invalid of ['-100', '1.5', '1,5', '1e6', '100abc', 'Infinity']) assert.equal(moneyDigits(invalid), null);
});

test('money entry keeps a caret next to the same digit when grouping changes', async () => {
  const { moneyCaret } = await import('../src/utils/moneyInput.js');
  assert.equal(moneyCaret('1 234 567', 0), 0);
  assert.equal(moneyCaret('1 234 567', 1), 1);
  assert.equal(moneyCaret('1 234 567', 4), 5);
  assert.equal(moneyCaret('1 234 567', 7), 9);
});
