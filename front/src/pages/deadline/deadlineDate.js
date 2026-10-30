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

export function defaultDeadlineDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part = name => parts.find(p=>p.type===name).value;
  return part('year')+'-'+part('month')+'-'+part('day');
}
export function deadlineCountdown(value, now = Date.now()) {
  const due = new Date(value).getTime(), current = new Date(now).getTime();
  if(!value||!Number.isFinite(due)||!Number.isFinite(current))return '';
  const day = time => Math.floor(Date.parse(defaultDeadlineDate(new Date(time))+'T00:00:00Z')/86400000);
  const difference=day(due)-day(current);
  if(due<current)return difference<0?'Quá '+Math.abs(difference)+' ngày':'Đã quá hạn';
  return difference===0?'Hôm nay':'Còn '+difference+' ngày';
}
