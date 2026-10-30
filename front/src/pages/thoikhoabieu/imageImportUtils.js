const fold = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
export function imageDay(text) {
  const normalized = fold(text).replace(/[.\s]/g, '');
  if (/^(cn|chunhat)$/.test(normalized)) return 8;
  const found = /^(?:t|thu)([2-7])$/.exec(normalized);
  return found ? Number(found[1]) : null;
}
export function timeRange(text) {
  const times = [...String(text).replace(/([-–])\s*(\d{1,2})\s*\/\s*([0-5]\d)\b/g, '$1 $2:$3').matchAll(/\b(?:(\d{1,2})\s*[:h.]\s*([0-5]\d)|([0-2]\d)([0-5]\d))\b/g)].map(m => `${(m[1] || m[3]).padStart(2, '0')}:${m[2] || m[4]}`);
  return times.length >= 2 && times[0] < '24:00' && times[1] < '24:00' ? times.slice(0, 2) : null;
}
function wordLines(words) {
  const sorted = [...words].sort((a,b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);
  const lines = [];
  for (const word of sorted) {
    const y = (word.bbox.y0 + word.bbox.y1) / 2;
    const height = word.bbox.y1 - word.bbox.y0;
    const line = lines.find(line => Math.abs(line.y - y) < Math.max(5, height * 0.55));
    if (line) { line.words.push(word); line.y = (line.y * (line.words.length - 1) + y) / line.words.length; }
    else lines.push({ y, words: [word] });
  }
  return lines.sort((a,b) => a.y-b.y).map(line => ({ ...line, coloredNote: line.words.some(word => word.coloredNote), text: line.words.sort((a,b) => a.bbox.x0-b.bbox.x0).map(w=>w.text).join(' ') }));
}
function metadata(text) { return /^(?:tiet|phong|lop|gv|ths|ts[. ]|pgs|dh\d|ghi\s*chu|tam ngung|nghi hoc)/.test(fold(text).replace(/^[^a-z0-9]+/, '')) || /\b[il]\d[-–]\d{2}\b/i.test(text); }
function sessions(lines, day) {
  const output = [];
  let previousTime = -1;
  for (let index = 0; index < lines.length; index++) {
    const range = timeRange(lines[index].text);
    if (!range) continue;
    const before = lines.slice(Math.max(previousTime + 1, index - 4), index);
    const title = [];
    const isNote = (line, position) => (line.coloredNote && position > 0 && !before[position - 1].coloredNote && !metadata(before[position - 1].text) && !timeRange(before[position - 1].text)) || /^(?:[^a-z]*)(?:ghi\s*chu|t[ao]m ngung|nghi hoc)/.test(fold(line.text));
    const annotationBeforeTime = before.some(isNote);
    for (let j=before.length-1; j>=0; j--) {
      const text = before[j].text.trim();
      const height=before[j].words?.reduce((sum,w)=>sum+w.bbox.y1-w.bbox.y0,0)/(before[j].words?.length || 1) || 12;
      if(title.length && before[j+1] && before[j+1].y-before[j].y>Math.max(35,height*2.5))break;
      if (isNote(before[j], j)) continue;
      if (!text || metadata(text) || imageDay(text) || /\d{1,2}\s*(?:th|thang)\d/i.test(fold(text))) break;
      title.unshift(text.replace(/^[^\p{L}\p{N}]+/u,''));
      if (title.length >= 3) break;
    }
    let end=index+1;
    while(end<lines.length && !timeRange(lines[end].text)) end++;
    const after=lines.slice(index+1,Math.min(end,index+8));
    const block=[...before,...after].map(l=>l.text).join(' ');
    const suspended=/t[ao]m ngung|nghi hoc|huy buoi|tam nghi/.test(fold(block));
    const room=after.find(l=>/phong/i.test(fold(l.text)) || /[il1]\d[-–]+\d{2}/i.test(l.text));
    const teacher=after.find(l=>/(?:^|\s)(?:gv[. :]|ths[. ]|ts[. ]|pgs[. ])/.test(fold(l.text)) && !/bao hoc|nghi|tam ngung/.test(fold(l.text)));
    const classCode=after.findIndex(l=>/dh\d/i.test(l.text));
    const plainTeacher=classCode>=0?after[classCode+1]?.text.replace(/^[^\p{L}]+/u,''):'';
    output.push({ id:`ocr-${day || 'unknown'}-${index}`, selected:!suspended, annotationBeforeTime, tenMon:title.join(' '), thu:day || '', gioBatDau:range[0], gioKetThuc:range[1], phongHoc:room ? room.text.replace(/^[^\p{L}\p{N}]+/u,'').slice(0,50) : '', giangVien:teacher ? teacher.text.replace(/^[^\p{L}]+/u,'').slice(0,100) : plainTeacher && !metadata(plainTeacher) && !timeRange(plainTeacher) ? plainTeacher.slice(0,100) : '', warning:suspended ? 'Ảnh có dấu hiệu tạm ngưng/nghỉ học. Đã bỏ chọn; kiểm tra trước khi thêm.' : !day ? 'Chưa xác định được thứ. Hãy chọn lại.' : '', source:lines[index].text, timeBox:lines[index].words?.length ? { x0:Math.min(...lines[index].words.map(w=>w.bbox.x0)), x1:Math.max(...lines[index].words.map(w=>w.bbox.x1)), y0:Math.min(...lines[index].words.map(w=>w.bbox.y0)), y1:Math.max(...lines[index].words.map(w=>w.bbox.y1)) } : null });
    previousTime=index;
  }
  return output;
}
export function getTimetableColumns(data) {
  const words=(data.blocks || []).flatMap(block=>(block.paragraphs || []).flatMap(p=>(p.lines || []).flatMap(line=>line.words || []))).filter(w=>w.text?.trim() && w.bbox);
  const headers=words.map(word=>({ day:imageDay(word.text), x:(word.bbox.x0+word.bbox.x1)/2, y:word.bbox.y1 })).filter(h=>h.day);
  const firstHeader=headers.length ? Math.min(...headers.map(h=>h.y)) : 0;
  const topHeaders=headers.filter(h=>Math.abs(h.y-firstHeader)<50);
  const unique=[...new Map(topHeaders.map(h=>[h.day,h])).values()].sort((a,b)=>a.day-b.day);
  if (unique.length>=2) {
    const slopes=[];
    for(let i=1;i<unique.length;i++) slopes.push((unique[i].x-unique[i-1].x)/(unique[i].day-unique[i-1].day));
    slopes.sort((a,b)=>a-b);
    const step=slopes[Math.floor(slopes.length/2)];
    if(step>20) {
      const start=unique.reduce((s,h)=>s+h.x-(h.day-2)*step,0)/unique.length;
      const y=Math.max(...unique.map(h=>h.y));
      return Array.from({length:7},(_,i)=>({day:i+2,left:start+i*step-step/2,right:start+i*step+step/2,top:y}));
    }
  }
  return [];
}
export function extractImageTimetable(data, fixedDay = null) {
  const words=(data.blocks || []).flatMap(block=>(block.paragraphs || []).flatMap(p=>(p.lines || []).flatMap(line=>line.words || []))).filter(w=>w.text?.trim() && w.bbox);
  if (fixedDay) return sessions(wordLines(words), fixedDay).slice(0,100);
  const columns=getTimetableColumns(data);
  if(columns.length) return columns.flatMap(column=>sessions(wordLines(words.filter(w=>w.bbox.y0>column.top && (w.bbox.x0+w.bbox.x1)/2>=column.left && (w.bbox.x0+w.bbox.x1)/2<column.right)),column.day)).slice(0,100);
  const lines=words.length?wordLines(words):(data.text || '').split(/\r?\n/).map((text,i)=>({text,y:i}));
  let day=null;const sections=[];let current=[];
  for(const line of lines){const found=imageDay(line.text);if(found){sections.push(...sessions(current,day));current=[];day=found;}else current.push(line);}
  return [...sections,...sessions(current,day)].slice(0,100);
}
const normalized = value => String(value || '').normalize('NFC').trim().toLocaleLowerCase('vi');
function same(a,b,semester) { return normalized(a.tenMon)===normalized(b.tenMon) && normalized(a.hocKy)===normalized(semester) && Number(a.thu)===Number(b.thu) && a.gioBatDau===b.gioBatDau && a.gioKetThuc===b.gioKetThuc; }
export function validateImageRows(rows, semester, existing=[]) {
  return rows.map((row,index)=>{
    const errors=[];let duplicate=false;
    if(!row.selected)return {errors,duplicate};
    if(!row.tenMon.trim() || row.tenMon.trim().length>100)errors.push('Tên môn cần 1–100 ký tự.');
    if(![2,3,4,5,6,7,8].includes(Number(row.thu)))errors.push('Chọn thứ.');
    const pattern=/^([01]\d|2[0-3]):[0-5]\d$/;
    if(!pattern.test(row.gioBatDau)||!pattern.test(row.gioKetThuc)||row.gioKetThuc<=row.gioBatDau)errors.push('Kiểm tra giờ bắt đầu/kết thúc.');
    if(row.phongHoc.length>50||row.giangVien.length>100)errors.push('Phòng tối đa 50 ký tự; giảng viên tối đa 100 ký tự.');
    if(semester.trim() && existing.some(item=>same(item,row,semester)))duplicate=true;
    const peers=[...(semester.trim()?existing:[]),...rows.slice(0,index).filter(item=>item.selected).map(item=>({...item,hocKy:semester}))];
    if(!duplicate && peers.some(item=>Number(item.thu)===Number(row.thu) && (!item.hocKy||!semester||item.hocKy===semester) && item.gioBatDau<row.gioKetThuc && item.gioKetThuc>row.gioBatDau))errors.push('Trùng giờ với một buổi đã có hoặc dòng được chọn phía trên.');
    return {errors,duplicate};
  });
}
export function imageRowsUpload(rows, semester) {
  const columns=['tenMon','thu','gioBatDau','gioKetThuc','phongHoc','giangVien','hocKy'];
  const quote=value=>'"'+String(value ?? '').replaceAll('"','""')+'"';
  const csv=[columns.join(','),...rows.filter(row=>row.selected).map(row=>columns.map(key=>quote(key==='hocKy'?semester.trim():String(row[key]).trim())).join(','))].join('\r\n');
  const bytes=new TextEncoder().encode(csv);
  let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
  return {kind:'timetable',filename:'lich-tu-anh.csv',content:btoa(binary)};
}
