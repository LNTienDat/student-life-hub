import { Buffer } from 'node:buffer';
import test from 'node:test';
import assert from 'node:assert/strict';
import { imageDay, timeRange, extractImageTimetable, validateImageRows, imageRowsUpload } from '../src/pages/thoikhoabieu/imageImportUtils.js';

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
  const rows=[row({tenMon:'',thu:9,gioKetThuc:'06:00',phongHoc:'x'.repeat(51)})];assert.equal(validateImageRows(rows,'')[0].errors.length,5);
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
