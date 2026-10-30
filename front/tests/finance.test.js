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

test('finance period navigation handles year boundaries and rejects invalid values', async () => {
  const { readFinancePeriod, shiftFinancePeriod } = await import('../src/pages/taichinh/financeUtils.js');
  assert.deepEqual(readFinancePeriod('2026-01'), { thang: 1, nam: 2026 });
  for (const invalid of ['', '2026-13', '2026-1', '0999-12', '10000-01']) assert.equal(readFinancePeriod(invalid), null);
  assert.equal(shiftFinancePeriod('2026-01', -1), '2025-12');
  assert.equal(shiftFinancePeriod('2026-12', 1), '2027-01');
  assert.equal(shiftFinancePeriod('1000-01', -1), null);
  assert.equal(shiftFinancePeriod('9999-12', 1), null);
});
test('new transactions default to the viewed month, not silently to today in another month', async () => {
  const { defaultTransactionDate } = await import('../src/pages/taichinh/financeUtils.js');
  const now = new Date('2026-10-23T18:00:00Z');
  assert.equal(defaultTransactionDate('2026-10', now), '2026-10-24');
  assert.equal(defaultTransactionDate('2026-01', now), '2026-01-01');
});
test('editing preserves exact original timestamp unless the calendar date changes', async () => {
  const { transactionDraft, transactionPayload } = await import('../src/pages/taichinh/financeUtils.js');
  const original = { id: 1, loai: 'chi', danhMuc: 'an_uong', soTien: 20000, ngayGiaoDich: '2026-01-14T18:30:00.000Z', moTa: 'Lunch' };
  const draft = transactionDraft(original, '2026-01');
  assert.equal(draft.ngayGiaoDich, '2026-01-15');
  assert.equal(transactionPayload({ ...draft, soTien: '35000' }, original).ngayGiaoDich, original.ngayGiaoDich);
  assert.equal(transactionPayload({ ...draft, ngayGiaoDich: '2026-02-15' }, original).ngayGiaoDich, '2026-02-15');
  for (const soTien of ['0', '-1', '1.5', '9007199254740993']) assert.throws(() => transactionPayload({ ...draft, soTien }, original));
  assert.throws(() => transactionPayload({ ...draft, ngayGiaoDich: '2026-02-30' }, original));
});
test('finance dates remain in Vietnam time on devices in other timezones', () => {
  const old = process.env.TZ; process.env.TZ = 'America/Los_Angeles';
  try { assert.equal(localDateInput(new Date('2026-01-31T17:01:00Z')), '2026-02-01'); }
  finally { if (old === undefined) delete process.env.TZ; else process.env.TZ = old; }
});

test('shared date labels follow Vietnam time instead of the device timezone', async () => {
  const { dinhDangNgay } = await import('../src/utils/formatters.js');
  const old = process.env.TZ; process.env.TZ = 'America/Los_Angeles';
  try { assert.equal(dinhDangNgay('2026-01-31T17:30:00Z'), '01/02/2026'); }
  finally { if (old === undefined) delete process.env.TZ; else process.env.TZ = old; }
});

test('switching transaction type clears incompatible categories but keeps compatible or all-type filters', async () => {
  const { updateTransactionFilters } = await import('../src/pages/taichinh/financeUtils.js');
  const categories=[{ma:'an_uong',loai:'chi'},{ma:'khac',loai:'thu'},{ma:'khac',loai:'chi'},{ma:'custom_old',loai:'chi',daAn:true}];
  const filters={timKiem:'cơm',locLoai:'chi',locDanhMuc:'an_uong'};
  assert.equal(updateTransactionFilters(filters,'locLoai','thu',categories).locDanhMuc,'');
  assert.equal(filters.locDanhMuc,'an_uong');
  assert.equal(updateTransactionFilters({...filters,locDanhMuc:'khac'},'locLoai','thu',categories).locDanhMuc,'khac');
  assert.equal(updateTransactionFilters({...filters,locDanhMuc:'custom_old'},'locLoai','',categories).locDanhMuc,'custom_old');
  assert.equal(updateTransactionFilters(filters,'timKiem','cafe',categories).locDanhMuc,'an_uong');
});
