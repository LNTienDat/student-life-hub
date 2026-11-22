import test from 'node:test';
import assert from 'node:assert/strict';
import { timetableToIcs, deadlinesToIcs, timetableGoogleCalendarUrl, deadlineGoogleCalendarUrl, studySessionGoogleCalendarUrl } from '../src/utils/icsExport.js';

test('timetableToIcs exports valid RFC 5545 recurring weekly classes with room, lecturer, and reminder', () => {
  const ics = timetableToIcs(
    [
      {
        id: 11,
        tenMon: 'Chuyển đổi số, Nhóm 01; K23',
        thu: 3,
        gioBatDau: '13:00',
        gioKetThuc: '17:15',
        phongHoc: 'I7-03 (học đường)',
        giangVien: 'ThS. Trương Thanh Thảo',
        hocKy: 'HK1 2026-2027',
      },
      {
        id: 12,
        tenMon: 'Buổi lỗi giờ',
        thu: 2,
        gioBatDau: '10:00',
        gioKetThuc: '09:00',
      },
    ],
    {
      weekStartDate: '2026-11-16', // Monday
      weeks: 12,
      semester: 'HK1 2026-2027',
      now: new Date('2026-11-18T00:00:00Z'),
    }
  );

  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  assert.match(ics, /TZID:Asia\/Ho_Chi_Minh/);
  // Thu 3 = Tuesday = 2026-11-17
  assert.match(ics, /DTSTART;TZID=Asia\/Ho_Chi_Minh:20261117T130000/);
  assert.match(ics, /DTEND;TZID=Asia\/Ho_Chi_Minh:20261117T171500/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;COUNT=12;BYDAY=TU/);
  assert.match(ics, /SUMMARY:Chuyển đổi số\\, Nhóm 01\\; K23/);
  assert.match(ics, /LOCATION:I7-03 \(học đường\)/);
  assert.match(ics, /TRIGGER:-PT15M/);
  assert.doesNotMatch(ics, /Buổi lỗi giờ/);
});

test('deadlinesToIcs exports pending deadlines in Vietnam time and skips completed or deleted items', () => {
  const ics = deadlinesToIcs([
    {
      id: 1,
      tieuDe: 'Nộp báo cáo đồ án',
      hanChot: '2026-11-20T16:59:00.000Z', // 23:59 Asia/Ho_Chi_Minh
      doUuTien: 'cao',
      trangThai: 'dang_dien_hanh',
      monHoc: { ten: 'Đồ án cơ sở 2' },
    },
    {
      id: 2,
      tieuDe: 'Việc đã xong',
      hanChot: '2026-11-19T10:00:00.000Z',
      doUuTien: 'binh_thuong',
      trangThai: 'hoan_thanh',
    },
    {
      id: 3,
      tieuDe: 'Việc đã xóa',
      hanChot: '2026-11-19T10:00:00.000Z',
      xoaLuc: '2026-11-18T05:00:00.000Z',
    },
  ]);

  assert.match(ics, /SUMMARY:\[Deadline\] Nộp báo cáo đồ án/);
  assert.match(ics, /DTSTART;TZID=Asia\/Ho_Chi_Minh:20261120T235900/);
  assert.match(ics, /PRIORITY:1/);
  assert.match(ics, /TRIGGER:-PT2H/);
  assert.doesNotMatch(ics, /Việc đã xong/);
  assert.doesNotMatch(ics, /Việc đã xóa/);
});

test('Google Calendar template URLs include recurring timetable rule and pending deadlines without Outlook dependency', () => {
  const classUrl = timetableGoogleCalendarUrl(
    {
      id: 11,
      tenMon: 'Lập trình Python',
      thu: 2,
      gioBatDau: '07:00',
      gioKetThuc: '09:30',
      phongHoc: 'I2-04',
      giangVien: 'ThS. A',
    },
    { weekStartDate: '2026-11-16', weeks: 15, semester: 'HK1' }
  );
  assert.match(classUrl, /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
  assert.match(classUrl, /action=TEMPLATE/);
  assert.match(classUrl, /dates=20261116T070000%2F20261116T093000/);
  assert.match(classUrl, /RRULE%3AFREQ%3DWEEKLY%3BCOUNT%3D15%3BBYDAY%3DMO/);
  assert.match(classUrl, /ctz=Asia%2FHo_Chi_Minh/);

  const taskUrl = deadlineGoogleCalendarUrl({
    id: 1,
    tieuDe: 'Nộp bài',
    hanChot: '2026-11-20T16:59:00.000Z',
    trangThai: 'dang_dien_hanh',
  });
  assert.match(taskUrl, /dates=20261120T235900%2F20261121T002900/);
  assert.equal(deadlineGoogleCalendarUrl({ id: 2, tieuDe: 'Xong', hanChot: '2026-11-20T16:59:00.000Z', trangThai: 'hoan_thanh' }), '');

  const studyUrl = studySessionGoogleCalendarUrl({
    tieuDe: 'Ôn tập: Python',
    ngayHoc: '2026-11-24',
    gioBatDau: '19:00',
    gioKetThuc: '20:30',
    monHoc: 'Python',
    reasons: ['Tránh 2 buổi học trong Thứ 3'],
  });
  assert.match(studyUrl, /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
  assert.match(studyUrl, /dates=20261124T190000%2F20261124T203000/);
  assert.match(studyUrl, /ctz=Asia%2FHo_Chi_Minh/);
  assert.equal(studySessionGoogleCalendarUrl({ ngayHoc: '2026-11-24', gioBatDau: '20:00', gioKetThuc: '19:00' }), '');
});
