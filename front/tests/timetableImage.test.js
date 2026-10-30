import { Buffer } from 'node:buffer';
import test from 'node:test';
import assert from 'node:assert/strict';
import { imageDay, timeRange, getTimetableColumns, extractImageTimetable, validateImageRows, imageRowsUpload } from '../src/pages/thoikhoabieu/imageImportUtils.js';

import { restoreCourseText, confirmedTimeRange } from '../src/pages/thoikhoabieu/ocrTextUtils.js';

const row = (overrides={}) => ({id:'r1',selected:true,tenMon:'Cơ sở dữ liệu',thu:2,gioBatDau:'07:00',gioKetThuc:'09:00',phongHoc:'A201',giangVien:'Nguyễn Văn An',...overrides});
const word=(text,x,y)=>({text,bbox:{x0:x-45,x1:x+45,y0:y,y1:y+14}});
const data=words=>({blocks:[{paragraphs:[{lines:words.map(w=>({words:[w]}))}]}]});
test('Vietnamese weekday and OCR time variants preserve correct day and range',()=>{
  assert.equal(imageDay('Thứ 2'),2);assert.equal(imageDay('T6'),6);assert.equal(imageDay('CN'),8);assert.equal(imageDay('Chủ nhật'),8);assert.equal(imageDay('12 Th10'),null);
  for(const text of ['07:00 - 11:15','© 0700 – 1115','13h00 - 17.15'])assert.deepEqual(timeRange(text),text.includes('13')?['13:00','17:15']:['07:00','11:15']);
  assert.equal(timeRange('Tiết 1–5'),null);assert.equal(timeRange('25:00 - 26:00'),null);
});
test('grid columns yield six sessions with suspended class deselected; prior lecturer never becomes the next title',()=>{
  const words=Array.from({length:7},(_,i)=>word(i===6?'CN':`T${i+2}`,100+i*200,10));
  for(const [x,title] of [[100,'Điện toán đám mây'],[700,'Phương pháp nghiên cứu'],[900,'Xử lý ảnh']]){
    if(x===900)words.push(word('Tạm ngưng',x,80));
    words.push(word(title,x,100),word('07:00 - 1115',x,120),word('Tiết 1-5',x,140),word('I3-06 (Phòng máy)',x,160),word('DH23TIN06',x,180),word('Võ Thanh Vinh',x,200),word('Lập trình Python',x,450),word('1300 - 1715',x,470));
  }
  const rows=extractImageTimetable(data(words));assert.equal(rows.length,6);assert.deepEqual(rows.map(r=>r.thu),[2,2,5,5,6,6]);
  assert.equal(rows[4].selected,false);assert.match(rows[4].warning,/tạm ngưng/);assert.equal(rows[1].tenMon,'Lập trình Python');assert.equal(rows[0].giangVien,'Võ Thanh Vinh');
});
test('missing weekdays remain editable and are never silently assigned Monday',()=>{
  const rows=extractImageTimetable({text:'Toán cao cấp\n07:00 - 09:00'});assert.equal(rows.length,1);assert.equal(rows[0].thu,'');assert.match(rows[0].warning,/Chưa xác định/);
  assert.match(validateImageRows(rows,'HK1')[0].errors.join(' '),/Chọn thứ/);
});
test('unknown/invalid fields block selected rows while deselected rows do not block saving',()=>{
  const rows=[row({tenMon:'',thu:9,gioKetThuc:'06:00',phongHoc:'x'.repeat(51)})];assert.equal(validateImageRows(rows,'')[0].errors.length,4);
  assert.deepEqual(validateImageRows([row({...rows[0],selected:false})],'')[0].errors,[]);
});
test('existing duplicates are skipped; within-file and existing overlaps block but adjacent sessions do not',()=>{
  const existing=[{...row(),hocKy:'HK1'}];assert.equal(validateImageRows([row()],'HK1',existing)[0].duplicate,true);
  assert.match(validateImageRows([row({tenMon:'Khác',gioBatDau:'08:00'})],'HK1',existing)[0].errors.join(' '),/Trùng/);
  assert.deepEqual(validateImageRows([row({gioBatDau:'09:00',gioKetThuc:'10:00'})],'HK1',existing)[0].errors,[]);
  assert.match(validateImageRows([row(),row({id:'r2'})],'HK1')[1].errors.join(' '),/Trùng/);
  assert.deepEqual(validateImageRows([row()],'HK2',existing)[0].errors,[]);
  assert.match(validateImageRows([row({tenMon:'Khác'})],'HK1',[{...existing[0],hocKy:''}])[0].errors.join(' '),/Trùng/);
});
test('only explicitly selected edited rows enter UTF-8 CSV with escaped commas and quotes',()=>{
  const upload=imageRowsUpload([row({tenMon:'Môn, "đã sửa"'}),row({id:'skip',selected:false})],' HK1 ');
  const csv=Buffer.from(upload.content,'base64').toString('utf8');assert.equal(upload.kind,'timetable');assert.match(csv,/"Môn, ""đã sửa"""/);assert.match(csv,/"HK1"/);assert.equal(csv.split('\r\n').length,2);
});

test('academic spelling suggestions restore OCR accents but preserve unknown courses, brands and lecturer-like names',()=>{
  assert.equal(restoreCourseText('Lap trình Python - Thực hanh'), 'Lập trình Python - Thực hành');
  assert.equal(restoreCourseText('Phương phóp nghiên cứu va viết bao cdo khoa học'), 'Phương pháp nghiên cứu và viết báo cáo khoa học');
  assert.equal(restoreCourseText('Điện toón đóm môy-Thực hành'), 'Điện toán đám mây-Thực hành');
  assert.equal(restoreCourseText('Kỹ nöng nghể nghiệp'), 'Kỹ năng nghề nghiệp');
  assert.equal(restoreCourseText('Ngôn ngữ mô hình hóc UML'), 'Ngôn ngữ mô hình hóa UML');
  assert.equal(restoreCourseText('Xử tý ỏnh - thực hành'), 'Xử lý ảnh - thực hành');
  assert.equal(restoreCourseText('Kiểm toán và phân tích ABC'), 'Kiểm toán và phân tích ABC');
  assert.equal(restoreCourseText('ThS. Đặng Mạnh Huy'), 'ThS. Đặng Mạnh Huy');
  assert.equal(restoreCourseText('LÝ THUYẾT ZYX'), 'LÝ THUYẾT ZYX');
  assert.equal(restoreCourseText('Mon chuyen nganh', ['Môn chuyên ngành']), 'Môn chuyên ngành');
});
test('clock OCR requires agreeing valid reads; conflicting, impossible and isolated results stay unresolved',()=>{
  assert.deepEqual(confirmedTimeRange([['18:00','17:15'],['13:00','17:15'],['13:00','17:15']]), ['13:00','17:15']);
  assert.equal(confirmedTimeRange([['15:00','17:15'],['13:00','17:15']]),null);
  assert.equal(confirmedTimeRange([null,['07:00','11:15']]),null);
  assert.equal(confirmedTimeRange([['07:00','07:00'],['25:00','26:00']]),null);
  assert.equal(confirmedTimeRange([['13:00','17:15'],['13:00','17:15'],['15:00','17:15'],['15:00','17:15']]),null);
});
test('column geometry includes empty weekdays and time bounds support targeted clock rereading',()=>{
  const words=[word('T2',100,10),word('T6',900,10),word('Lập trình Python',100,100),word('18:00 - 1715',100,120)];
  const columns=getTimetableColumns(data(words));
  assert.equal(columns.length,7);assert.equal(columns[3].day,5);assert.equal(columns[3].left,600);assert.equal(columns[3].right,800);
  const rows=extractImageTimetable(data(words));
  assert.deepEqual(rows[0].timeBox,{x0:55,x1:145,y0:120,y1:134});
  const fixed=extractImageTimetable(data([word('Lập trình Python',100,100),word('13:00 - 1715',100,120)]),7);
  assert.equal(fixed[0].thu,7);assert.equal(fixed[0].tenMon,'Lập trình Python');
});
test('damaged end-time separators remain recoverable without accepting arbitrary dates as time ranges',()=>{
  assert.deepEqual(timeRange('15:00 - 1/15'),['15:00','01:15']);
  assert.equal(timeRange('26/10/2026'),null);
  const rows=extractImageTimetable({text:'Kỹ năng nghề nghiệp\n15:00 - 1/15'});
  assert.equal(rows.length,1);
  assert.match(validateImageRows(rows.map(row=>({...row,thu:5})),'HK1')[0].errors.join(' '),/giờ/);
});

test('colored note following a course title stays out of the title even when OCR garbles its label', () => {
  const words = [
    word('Kỹ năng nghề nghiệp', 100, 100),
    { ...word('(@NchöHpephòngmáy |', 100, 125), coloredNote: true },
    word('13:00 - 17:15', 100, 150),
    word('I4-03', 100, 175),
    word('GV. Võ Văn Phúc', 100, 200),
  ];
  const rows = extractImageTimetable(data(words), 5);
  assert.equal(rows[0].tenMon, 'Kỹ năng nghề nghiệp');
  assert.equal(rows[0].phongHoc, 'I4-03');
  assert.equal(rows[0].annotationBeforeTime, true);
  assert.equal(rows[0].selected, true);
});
test('note labels are excluded without dropping wrapped course titles', () => {
  for (const note of ['Ghi chú: Học phòng máy', 'Ghichú: Học phòng máy']) {
    const rows = extractImageTimetable({ text: 'Phương pháp nghiên cứu và viết\nbáo cáo khoa học\n' + note + '\n07:00 - 11:15' });
    assert.equal(rows[0].tenMon, 'Phương pháp nghiên cứu và viết báo cáo khoa học');
  }
  const rows = extractImageTimetable(data([
    { ...word('Môn có tiêu đề màu cam', 100, 100), coloredNote: true },
    { ...word('xuống dòng thứ hai', 100, 125), coloredNote: true },
    word('13:00 - 17:15', 100, 150),
  ]), 5);
  assert.equal(rows[0].tenMon, 'Môn có tiêu đề màu cam xuống dòng thứ hai');
});

test('OCR Lop trinh is a course title, not a class metadata line',()=>{
 const r=extractImageTimetable({text:'Lộp trình Python - Thực hành\n13:00 - 17:15'},2);
 // Fixed-day extraction uses positioned OCR words.
 const words=[word('Lộp trình Python - Thực hành',100,100),word('13:00 - 17:15',100,125)];
 const parsed=extractImageTimetable(data(words),2);
 assert.equal(parsed[0].tenMon,'Lộp trình Python - Thực hành');
 assert.deepEqual(r,[]);
});
