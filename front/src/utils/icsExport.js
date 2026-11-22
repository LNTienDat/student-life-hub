const ICS_WEEKDAYS = { 2: 'MO', 3: 'TU', 4: 'WE', 5: 'TH', 6: 'FR', 7: 'SA', 8: 'SU' };
const CLOCK_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function escapeIcsText(value) {
  return String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,');
}

function foldIcsLine(line) {
  const text = String(line);
  if (text.length <= 74) return text;
  const parts = [];
  for (let i = 0; i < text.length; i += 74) {
    parts.push((i === 0 ? '' : ' ') + text.slice(i, i + 74));
  }
  return parts.join('\r\n');
}

function addCalendarDays(dateStr, days) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || '').trim());
  if (!match) return '';
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function formatIcsLocal(dateStr, clock) {
  const compactDate = dateStr.replaceAll('-', '');
  const compactClock = clock.replaceAll(':', '');
  return `${compactDate}T${compactClock}00`;
}

function formatUtcStamp(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const h = String(now.getUTCHours()).padStart(2, '0');
  const min = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

function buildCalendarShell(calendarName, events, now = new Date()) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LifeHub//Student Life Hub//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Ho_Chi_Minh',
    'BEGIN:STANDARD',
    'DTSTART:19750101T000000',
    'TZOFFSETFROM:+0700',
    'TZOFFSETTO:+0700',
    'TZNAME:ICT',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...events,
    'END:VCALENDAR',
  ];
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`.replace('{{DTSTAMP}}', formatUtcStamp(now));
}

export function timetableToIcs(classes = [], { weekStartDate, weeks = 15, semester = '', now = new Date() } = {}) {
  const startMonday = /^\d{4}-\d{2}-\d{2}$/.test(String(weekStartDate || ''))
    ? weekStartDate
    : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
  const stamp = formatUtcStamp(now);
  const count = Math.max(1, Math.min(52, Number(weeks) || 15));
  const events = [];

  classes.forEach((item, index) => {
    const thu = Number(item?.thu);
    const byDay = ICS_WEEKDAYS[thu];
    const startClock = String(item?.gioBatDau || '').trim();
    const endClock = String(item?.gioKetThuc || '').trim();
    if (!byDay || !CLOCK_RE.test(startClock) || !CLOCK_RE.test(endClock) || endClock <= startClock) return;

    const eventDate = addCalendarDays(startMonday, thu - 2);
    if (!eventDate) return;
    const summary = String(item?.tenMon || '').trim() || 'Buổi học';
    const descParts = [];
    if (item?.giangVien) descParts.push(`Giảng viên: ${item.giangVien}`);
    if (item?.hocKy || semester) descParts.push(`Học kỳ: ${item.hocKy || semester}`);

    events.push(
      'BEGIN:VEVENT',
      `UID:lifehub-tkb-${item?.id ?? index}-${eventDate}@lifehub.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Asia/Ho_Chi_Minh:${formatIcsLocal(eventDate, startClock)}`,
      `DTEND;TZID=Asia/Ho_Chi_Minh:${formatIcsLocal(eventDate, endClock)}`,
      `RRULE:FREQ=WEEKLY;COUNT=${count};BYDAY=${byDay}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      ...(item?.phongHoc ? [`LOCATION:${escapeIcsText(item.phongHoc)}`] : []),
      ...(descParts.length ? [`DESCRIPTION:${escapeIcsText(descParts.join('\n'))}`] : []),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(`Sắp đến giờ học: ${summary}`)}`,
      'TRIGGER:-PT15M',
      'END:VALARM',
      'END:VEVENT'
    );
  });

  const label = semester ? `Lịch học ${semester} - LifeHub` : 'Lịch học - LifeHub';
  return buildCalendarShell(label, events, now);
}

function vietnamDateTimeParts(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    dateStr: `${map.year}-${map.month}-${map.day}`,
    clock: `${map.hour}:${map.minute}`,
    endDate: new Date(date.getTime() + 30 * 60_000),
  };
}

export function deadlinesToIcs(deadlines = [], { now = new Date() } = {}) {
  const stamp = formatUtcStamp(now);
  const events = [];

  deadlines.forEach((item, index) => {
    if (!item || item.trangThai === 'hoan_thanh' || item.xoaLuc) return;
    const due = vietnamDateTimeParts(item.hanChot);
    if (!due) return;
    const endDue = vietnamDateTimeParts(due.endDate.toISOString());
    const summary = `[Deadline] ${String(item.tieuDe || 'Công việc').trim()}`;
    const priority = item.doUuTien === 'cao' ? '1' : item.doUuTien === 'thap' ? '9' : '5';
    const descParts = [];
    if (item.monHoc?.ten) descParts.push(`Môn học: ${item.monHoc.ten}`);
    if (item.moTa) descParts.push(item.moTa);

    events.push(
      'BEGIN:VEVENT',
      `UID:lifehub-dl-${item.id ?? index}@lifehub.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Asia/Ho_Chi_Minh:${formatIcsLocal(due.dateStr, due.clock)}`,
      `DTEND;TZID=Asia/Ho_Chi_Minh:${formatIcsLocal(endDue.dateStr, endDue.clock)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `PRIORITY:${priority}`,
      ...(descParts.length ? [`DESCRIPTION:${escapeIcsText(descParts.join('\n'))}`] : []),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(`Sắp hết hạn: ${item.tieuDe || 'Deadline'}`)}`,
      'TRIGGER:-PT2H',
      'END:VALARM',
      'END:VEVENT'
    );
  });

  return buildCalendarShell('Deadline - LifeHub', events, now);
}

export const GOOGLE_CALENDAR_IMPORT_URL = 'https://calendar.google.com/calendar/r/settings/export';

export function timetableGoogleCalendarUrl(item, { weekStartDate, weeks = 15, semester = '', now = new Date() } = {}) {
  const thu = Number(item?.thu);
  const byDay = ICS_WEEKDAYS[thu];
  const startClock = String(item?.gioBatDau || '').trim();
  const endClock = String(item?.gioKetThuc || '').trim();
  if (!byDay || !CLOCK_RE.test(startClock) || !CLOCK_RE.test(endClock) || endClock <= startClock) return '';

  const startMonday = /^\d{4}-\d{2}-\d{2}$/.test(String(weekStartDate || ''))
    ? weekStartDate
    : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
  const eventDate = addCalendarDays(startMonday, thu - 2);
  if (!eventDate) return '';

  const count = Math.max(1, Math.min(52, Number(weeks) || 15));
  const summary = String(item?.tenMon || '').trim() || 'Buổi học';
  const descParts = [];
  if (item?.giangVien) descParts.push(`Giảng viên: ${item.giangVien}`);
  if (item?.hocKy || semester) descParts.push(`Học kỳ: ${item.hocKy || semester}`);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: summary,
    dates: `${formatIcsLocal(eventDate, startClock)}/${formatIcsLocal(eventDate, endClock)}`,
    ctz: 'Asia/Ho_Chi_Minh',
    recur: `RRULE:FREQ=WEEKLY;COUNT=${count};BYDAY=${byDay}`,
  });
  if (item?.phongHoc) params.set('location', item.phongHoc);
  if (descParts.length) params.set('details', descParts.join('\n'));
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function deadlineGoogleCalendarUrl(item) {
  if (!item || item.trangThai === 'hoan_thanh' || item.xoaLuc) return '';
  const due = vietnamDateTimeParts(item.hanChot);
  if (!due) return '';
  const endDue = vietnamDateTimeParts(due.endDate.toISOString());
  const summary = `[Deadline] ${String(item.tieuDe || 'Công việc').trim()}`;
  const descParts = [];
  if (item.monHoc?.ten) descParts.push(`Môn học: ${item.monHoc.ten}`);
  if (item.moTa) descParts.push(item.moTa);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: summary,
    dates: `${formatIcsLocal(due.dateStr, due.clock)}/${formatIcsLocal(endDue.dateStr, endDue.clock)}`,
    ctz: 'Asia/Ho_Chi_Minh',
  });
  if (descParts.length) params.set('details', descParts.join('\n'));
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function studySessionGoogleCalendarUrl(session) {
  const ngayHoc = String(session?.ngayHoc || '').trim();
  const startClock = String(session?.gioBatDau || '').trim();
  const endClock = String(session?.gioKetThuc || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngayHoc) || !CLOCK_RE.test(startClock) || !CLOCK_RE.test(endClock) || endClock <= startClock) {
    return '';
  }
  const summary = String(session?.tieuDe || 'Phiên ôn tập').trim();
  const descParts = [];
  if (session?.monHoc) descParts.push(`Môn học: ${session.monHoc}`);
  if (Array.isArray(session?.reasons) && session.reasons.length) {
    descParts.push(`Lý do xếp lịch:\n- ${session.reasons.join('\n- ')}`);
  }
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: summary,
    dates: `${formatIcsLocal(ngayHoc, startClock)}/${formatIcsLocal(ngayHoc, endClock)}`,
    ctz: 'Asia/Ho_Chi_Minh',
  });
  if (descParts.length) params.set('details', descParts.join('\n'));
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
