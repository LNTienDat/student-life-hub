const OFFSET = 7 * 60 * 60 * 1000;
function vietnamParts(value = new Date()) {
  const date = new Date(new Date(value).getTime() + OFFSET);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), weekday: date.getUTCDay() || 7 };
}
function monthRange(month, year) {
  return { from: new Date(Date.UTC(year, month - 1, 1) - OFFSET), to: new Date(Date.UTC(year, month, 1) - OFFSET) };
}
function readPeriod(query = {}, requirePair = false) {
  const now = vietnamParts();
  const { thang, nam } = query;
  if (requirePair && (thang !== undefined) !== (nam !== undefined)) throw Object.assign(new Error('Vui lòng chọn cả tháng và năm'), { statusCode: 400 });
  const month = thang === undefined ? now.month : Number(thang);
  const year = nam === undefined ? now.year : Number(nam);
  if ((thang !== undefined && !/^\d{1,2}$/.test(String(thang))) || (nam !== undefined && !/^\d{4}$/.test(String(nam))) || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1000 || year > 9999) throw Object.assign(new Error('Tháng/năm không hợp lệ'), { statusCode: 400 });
  return { thang: month, nam: year, ...monthRange(month, year) };
}
function parseVietnamDate(value) {
  if (typeof value !== 'string' || !value.trim()) return new Date(NaN);
  const raw = value.trim();
  const calendar = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(raw);
  if (!calendar) return new Date(NaN);
  const [, year, month, day] = calendar.map(Number);
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()) return new Date(NaN);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T00:00:00+07:00`);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(raw)) return new Date(`${raw}+07:00`);
  return new Date(raw);
}
module.exports = { vietnamParts, monthRange, readPeriod, parseVietnamDate };
