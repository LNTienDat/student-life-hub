const fold = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
export function imageDay(text) {
  const normalized = fold(text).replace(/[.\s]/g, '');
  if (/^(cn|chunhat)$/.test(normalized)) return 8;
  const found = /^(?:t|thu)([2-7])$/.exec(normalized);
  return found ? Number(found[1]) : null;
}
const clockToken = '(?:\\d{1,2}\\s*[:h.;]\\s*[0-5]\\d|[0-2]\\d[0-5]\\d)';
const clockPair = new RegExp(`\\b(${clockToken})\\s*(?:[-–—−~]|đến|den)\\s*(${clockToken})\\b`, 'i');
const spacedClockPair = new RegExp(`\\b(${clockToken})\\s+(${clockToken})\\b`, 'i');

function readTime(text) {
  const source = String(text);
  // A slash can be a damaged colon after a dash. Leave dates and other slashes alone.
  const normalized = source.replace(/([-–—−]\s*\d{1,2}\s*)\/(\s*[0-5]\d\b)/g, '$1:$2');
  const explicit = clockPair.exec(normalized);
  const match = explicit || spacedClockPair.exec(normalized);
  if (!match || (!explicit && !/[:h.;]/i.test(match[1] + match[2]))) return null;
  const range = [match[1], match[2]].map(token => {
    const digits = token.replace(/\D/g, '').padStart(4, '0');
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  });
  if (!range.every(time => time < '24:00')) return null;
  const end = match.index + match[0].length;
  return { range, start: match.index, end, prefix: source.slice(0, match.index), suffix: source.slice(end) };
}
export function timeRange(text) {
  return readTime(text)?.range || null;
}
export function wordsFromOcr(data) {
  return (data.blocks || []).flatMap(block => (block.paragraphs || [])
    .flatMap(paragraph => (paragraph.lines || []).flatMap(line => line.words || [])))
    .filter(word => word.text?.trim() && word.bbox);
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
const cleanedLine = text => text.trim().replace(/^[^\p{L}\p{N}]+/u, '');
const teacherLabel = /^(?:gv|th\s*\.?\s*s|ts|pgs(?:\s*\.?\s*ts)?)(?:[. :]+|$)/;
const classLabel = /^(?:dh\d|lop(?:\s*:|\s+(?:dh|\d)))/;
const noteLabel = /(?:^ghi\s*chu\b|\s+ghi\s*chu\s*[:.-]|(?:^|\s)(?:tam ngung|nghi hoc|huy buoi|tam nghi)\b)/;
const suspendedLabel = /^(?:t[ao]m ngung|nghi hoc|huy buoi|tam nghi)\b/;
const roomCode = /\b([il1][2-5]|[il]\d)\s*[-–—]+\s*(\d{2})\b/i;
const roomText = text => text.replace(/\bph[oò]ng\s+m[aáàoó]y(?:\s+t[ií]nh)?\b/gi, match =>
  /\bt[ií]nh\b/i.test(match) ? 'Phòng máy tính' : 'Phòng máy').replace(/\s+\|$/, '').slice(0, 50);

function roomFromLine(text) {
  const line = cleanedLine(text);
  const code = roomCode.exec(line);
  const label = /^phong(?:\s*[:.-]\s*|\s+(?=[a-z]{0,3}\d))/i.exec(fold(line));
  if (code && (code.index === 0 || /^[\d\s]+$/.test(line.slice(0, code.index)) || label)) {
    const hasRoomLabel = label || /\(\s*phong\b/.test(fold(line));
    const building = code[1].replace(/^[il]|^1(?=\d$)/i, prefix => prefix === '1' && !hasRoomLabel ? prefix : 'I');
    return roomText(`${building}-${code[2]}${line.slice(code.index + code[0].length)}`);
  }
  // A standalone room such as "A101" is safe after a clock line.
  if (/^[A-Z]{1,3}\d{2,4}(?:\s*\([^)]*\))?$/.test(line) && !classLabel.test(fold(line))) return line.slice(0, 50);
  if (label) return roomText(line.slice(label[0].length));
  return '';
}

function metadata(text) {
  const line = fold(cleanedLine(text));
  return /^(?:tiet\s*\d|phong\s*:)/.test(line) || teacherLabel.test(line)
    || classLabel.test(line) || Boolean(roomFromLine(text));
}

function stripTitleNote(text) {
  const source = cleanedLine(text.normalize('NFC'));
  const marker = fold(source).search(noteLabel);
  return (marker < 0 ? source : source.slice(0, marker)).trim();
}

function plausibleUnlabeledTeacher(text) {
  if (!text || metadata(text)) return '';
  const name = cleanedLine(text);
  const tokens = name.split(/\s+/);
  return tokens.length >= 2 && tokens.length <= 6
    && /^(?:nguyen|tran|le|pham|vo|vu|dang|ngo|bui|hoang|huynh|do|ho|duong|dinh|phan|trinh|ly|luu|mai|truong)$/.test(fold(tokens[0]))
    && tokens.every(token => /^\p{Lu}\p{L}+$/u.test(token)) ? name.slice(0, 100) : '';
}

function clockBox(words, reading) {
  if (!words?.length) return null;
  let offset = 0;
  const timeWords = words.filter(word => {
    const start = offset;
    offset += word.text.length + 1;
    return offset - 1 > reading.start && start < reading.end;
  });
  const bounds = timeWords.length ? timeWords : words;
  return {
    x0: Math.min(...bounds.map(word => word.bbox.x0)),
    x1: Math.max(...bounds.map(word => word.bbox.x1)),
    y0: Math.min(...bounds.map(word => word.bbox.y0)),
    y1: Math.max(...bounds.map(word => word.bbox.y1)),
  };
}

function sessions(lines, day) {
  const parsed = [];
  let previousTime = -1;
  for (let index = 0; index < lines.length; index++) {
    const reading = readTime(lines[index].text);
    if (!reading || metadata(reading.prefix)) continue;
    const first = Math.max(previousTime + 1, index - 6);
    const before = lines.slice(first, index);
    const title = [];
    let titleStart = index;
    const inlineTitle = stripTitleNote(reading.prefix).replace(/[^\p{L}\p{N})]+$/u, '');
    if (/\p{L}{2}/u.test(inlineTitle) && !imageDay(inlineTitle)) title.push(inlineTitle);
    let annotationBeforeTime = stripTitleNote(reading.prefix) !== cleanedLine(reading.prefix);
    let suspended = false;
    for (let j = before.length - 1; j >= 0 && title.length < 3; j--) {
      const line = before[j];
      const text = cleanedLine(line.text);
      const preceding = lines[first + j - 1];
      const next = lines[first + j + 1];
      const height = line.words?.length ? line.words.reduce((sum, word) => sum + word.bbox.y1 - word.bbox.y0, 0) / line.words.length : 12;
      if (line.words?.length && next.y - line.y > Math.max(35, height * 2.5)) break;
      if (!text || metadata(text) || imageDay(text) || /\d{1,2}\s*(?:th|thang)\s*\d/i.test(fold(text))) break;
      if (preceding && classLabel.test(fold(cleanedLine(preceding.text))) && plausibleUnlabeledTeacher(text)) break;
      if (suspendedLabel.test(fold(text))) {
        suspended = true;
        titleStart = first + j;
        break;
      }
      const looksColoredNote = line.coloredNote && j > 0 && !before[j - 1].coloredNote
        && !metadata(before[j - 1].text) && !timeRange(before[j - 1].text);
      const fragment = stripTitleNote(text);
      annotationBeforeTime ||= looksColoredNote || fragment !== text;
      if (!looksColoredNote && fragment) title.unshift(fragment);
      if (fragment || looksColoredNote || annotationBeforeTime) titleStart = first + j;
    }
    parsed.push({ index, titleStart, title: title.join(' '), annotationBeforeTime, suspended, reading });
    previousTime = index;
  }
  return parsed.map((entry, position) => {
    const { index, title, reading, annotationBeforeTime } = entry;
    const end = Math.min(parsed[position + 1]?.titleStart ?? lines.length, index + 8);
    const after = [reading.suffix, ...lines.slice(index + 1, end).map(line => line.text)].map(cleanedLine).filter(Boolean);
    const room = after.map(roomFromLine).find(Boolean) || '';
    const labeledTeacher = after.find(text => teacherLabel.test(fold(text)) && !/bao hoc|nghi hoc|tam ngung/.test(fold(text)));
    const classIndex = after.findIndex(text => classLabel.test(fold(text)));
    const teacher = labeledTeacher?.slice(0, 100) || (classIndex >= 0 ? plausibleUnlabeledTeacher(after[classIndex + 1]) : '');
    const suspended = entry.suspended || after.some(text => suspendedLabel.test(fold(text)));
    return {
      id: `ocr-${day || 'unknown'}-${index}`, selected: !suspended, annotationBeforeTime, tenMon: title, thu: day || '',
      gioBatDau: reading.range[0], gioKetThuc: reading.range[1], phongHoc: room, giangVien: teacher,
      warning: suspended ? 'Ảnh có dấu hiệu tạm ngưng/nghỉ học. Đã bỏ chọn; kiểm tra trước khi thêm.' : !day ? 'Chưa xác định được thứ. Hãy chọn lại.' : '',
      source: lines[index].text, timeBox: clockBox(lines[index].words, reading),
    };
  });
}
export function getTimetableColumns(data) {
  const words = wordsFromOcr(data);
  const headers = wordLines(words).flatMap(line => line.words.flatMap((word, index, lineWords) => {
    const next = lineWords[index + 1];
    const direct = imageDay(word.text);
    const nearby = next && next.bbox.x0 - word.bbox.x1 < (word.bbox.y1 - word.bbox.y0) * 1.5;
    const day = direct || (nearby && imageDay(`${word.text} ${next.text}`));
    if (!day) return [];
    const end = direct ? word : next;
    return [{ day, x: (word.bbox.x0 + end.bbox.x1) / 2, y: Math.max(word.bbox.y1, end.bbox.y1) }];
  }));
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
// Geometry fallback for a complete seven-column calendar whose tiny weekday text is unreadable.
// It separates classes but deliberately leaves weekdays unknown for user confirmation.
export function getTimetableGridColumns({data,width,height}) {
  const peaks=[];
  for(let x=0;x<width;x++) {
    let count=0,total=0;
    for(let y=Math.floor(height*.15);y<height*.9;y++) {
      const i=(y*width+x)*4,r=data[i],g=data[i+1],b=data[i+2];total++;
      if(Math.min(r,g,b)>=180&&Math.max(r,g,b)<250&&Math.max(r,g,b)-Math.min(r,g,b)<10)count++;
    }
    if(count>total*.5)peaks.push(x);
  }
  const groups=[];for(const x of peaks){if(groups.length&&x-groups.at(-1).at(-1)<=2)groups.at(-1).push(x);else groups.push([x]);}
  const lines=groups.map(group=>group.reduce((a,b)=>a+b,0)/group.length);
  const gaps=lines.slice(1).map((x,i)=>x-lines[i]).filter(gap=>gap>width/12&&gap<width/5).sort((a,b)=>a-b);
  if(gaps.length<4)return [];
  const step=gaps[Math.floor(gaps.length/2)];
  const lattice=lines.filter(x=>lines.some(other=>Math.abs(Math.abs(x-other)-step)<step*.08));
  if(lattice.length<5)return [];
  let start=lattice[0];while(start-step>=-step*.2)start-=step;
  if(start< -step*.1||start+step*7>width+step*.25||step*7<width*.8)return [];
  return Array.from({length:7},(_,i)=>({day:null,left:Math.max(0,start+i*step),right:Math.min(width,start+(i+1)*step),top:0}));
}
export function extractImageTimetable(data, fixedDay = null) {
  const words = wordsFromOcr(data);
  const lines = words.length ? wordLines(words) : (data.text || '').split(/\r?\n/).map((text, i) => ({ text, y: i }));
  if (fixedDay) return sessions(lines, Number(fixedDay) || null).slice(0, 100);
  const columns=getTimetableColumns(data);
  if(columns.length) return columns.flatMap(column=>sessions(wordLines(words.filter(w=>w.bbox.y0>column.top && (w.bbox.x0+w.bbox.x1)/2>=column.left && (w.bbox.x0+w.bbox.x1)/2<column.right)),column.day)).slice(0,100);
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
