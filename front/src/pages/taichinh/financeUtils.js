import { validDong, moneyError } from '../../utils/money.js';
export function transactionQuery(filters = {}, page = 1) {
  const query = { trang: page, soLuong: 10 };
  if (filters.timKiem?.trim()) query.q = filters.timKiem.trim();
  if (filters.locLoai) query.loai = filters.locLoai;
  if (filters.locDanhMuc) query.danhMuc = filters.locDanhMuc;
  if (filters.chiThangNay) { query.thang = filters.thang; query.nam = filters.nam; }
  return query;
}
export function financeSummary(thongKe, budgetResponse, trendResponse) {
  return { thongKe, nganSachs: budgetResponse.ketQua || [], xuHuong: trendResponse.xuHuong || [] };
}
// Finance API groups dates in Vietnam time, independent of the device timezone.
export function localDateInput(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = type => parts.find(p => p.type === type)?.value;
  return value('year') + '-' + value('month') + '-' + value('day');
}
export function readFinancePeriod(value) {
  if (typeof value !== 'string' || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value)) return null;
  return { nam: Number(value.slice(0, 4)), thang: Number(value.slice(5, 7)) };
}
export function shiftFinancePeriod(value, delta) {
  const period = readFinancePeriod(value);
  if (!period || !Number.isInteger(delta)) return null;
  const index = period.nam * 12 + period.thang - 1 + delta;
  const year = Math.floor(index / 12), month = index % 12 + 1;
  return year >= 1000 && year <= 9999 ? year + '-' + String(month).padStart(2, '0') : null;
}
export function defaultTransactionDate(period, now = new Date()) {
  const today = localDateInput(now);
  return today.startsWith(period + '-') ? today : period + '-01';
}
export function transactionDraft(transaction, period, now = new Date()) {
  return transaction ? {
    loai: transaction.loai, danhMuc: transaction.danhMuc, soTien: String(transaction.soTien),
    moTa: transaction.moTa || '', ngayGiaoDich: localDateInput(new Date(transaction.ngayGiaoDich)),
  } : { loai: 'chi', danhMuc: 'an_uong', soTien: '', moTa: '', ngayGiaoDich: defaultTransactionDate(period, now) };
}
export function transactionPayload(draft, original = null) {
  const amount = Number(draft.soTien);
  if (!validDong(draft.soTien)) throw new Error(moneyError);
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(draft.ngayGiaoDich) || Number.isNaN(Date.parse(draft.ngayGiaoDich + 'T00:00:00+07:00')) || localDateInput(new Date(draft.ngayGiaoDich + 'T00:00:00+07:00')) !== draft.ngayGiaoDich) throw new Error('Chọn ngày giao dịch hợp lệ.');
  // Editing an amount/description must not reset the original transaction time.
  const date = original && draft.ngayGiaoDich === localDateInput(new Date(original.ngayGiaoDich))
    ? original.ngayGiaoDich : draft.ngayGiaoDich;
  return { loai: draft.loai, danhMuc: draft.danhMuc, soTien: amount, moTa: draft.moTa.trim(), ngayGiaoDich: date, ...(draft.anhHoaDonHash?{anhHoaDonHash:draft.anhHoaDonHash}:{}) };
}

export function updateTransactionFilters(filters, key, value, categories) {
  const next = { ...filters, [key]: value };
  if (key === 'locLoai' && next.locDanhMuc && !categories.some(item => item.ma === next.locDanhMuc && (!value || item.loai === value))) next.locDanhMuc = '';
  return next;
}
