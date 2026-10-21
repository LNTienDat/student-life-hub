import { dinhDangNgay } from '../../utils/formatters.js';

// A date-only deadline expires at the end of the chosen local day, not at midnight.
export function deadlineToISO(value) {
  const match = /^(\d{4}-\d{2}-\d{2})(?:T([0-2]\d):([0-5]\d))?$/.exec(value);
  const date = new Date(value.includes('T') ? value : `${value}T23:59:59.999`);
  if (!match || !Number.isFinite(date.getTime()) || date.getFullYear() !== Number(value.slice(0, 4)) || date.getMonth() + 1 !== Number(value.slice(5, 7)) || date.getDate() !== Number(value.slice(8, 10))) throw new Error('Vui lòng chọn ngày hạn chót hợp lệ.');
  return date.toISOString();
}

export function deadlineHasTime(value) {
  const date = new Date(value);
  return !(date.getHours() === 23 && date.getMinutes() === 59 && date.getSeconds() === 59 && date.getMilliseconds() === 999);
}

export function deadlineInputValue(value) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
  return local.slice(0, deadlineHasTime(value) ? 16 : 10);
}

export function formatDeadlineDate(value) {
  return dinhDangNgay(value, deadlineHasTime(value));
}
