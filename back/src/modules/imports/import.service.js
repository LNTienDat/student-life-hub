const { overlaps } = require('../thoikhoabieu/conflicts');
const ExcelJS = require('exceljs');
const { Readable } = require('stream');

const columns = {
  subjects: ['ten', 'tinChi', 'hocKy'],
  timetable: ['tenMon', 'thu', 'gioBatDau', 'gioKetThuc', 'phongHoc', 'giangVien', 'hocKy'],
};
function text(value) {
  if (value == null) return '';
  if (typeof value === 'object') throw new Error('Chỉ dùng giá trị thuần, không dùng công thức, liên kết hoặc ô gộp.');
  return String(value).trim();
}
function time(value) {
  if (typeof value === 'number' && value >= 0 && value < 1) {
    const minutes = Math.round(value * 1440);
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }
  if (value instanceof Date) return value.toISOString().slice(11, 16);
  return text(value);
}
function validateRow(kind, row) {
  const errors = [];
  const name = kind === 'subjects' ? row.ten : row.tenMon;
  if (!name || name.length > 100) errors.push('Tên môn cần có từ 1–100 ký tự.');
  if (!row.hocKy || row.hocKy.length > 100) errors.push('Học kỳ cần có từ 1–100 ký tự.');
  if (kind === 'subjects') {
    if (!Number.isInteger(row.tinChi) || row.tinChi < 1 || row.tinChi > 20) errors.push('Tín chỉ phải là số nguyên từ 1–20.');
  } else {
    if (!Number.isInteger(row.thu) || row.thu < 2 || row.thu > 8) errors.push('Thứ phải từ 2–8 (8 là Chủ nhật).');
    const pattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!pattern.test(row.gioBatDau) || !pattern.test(row.gioKetThuc) || row.gioKetThuc <= row.gioBatDau) errors.push('Giờ dùng HH:mm, kết thúc sau bắt đầu.');
    if (row.phongHoc.length > 50 || row.giangVien.length > 100) errors.push('Phòng tối đa 50 ký tự, giảng viên tối đa 100 ký tự.');
  }
  return errors;
}
function rowKey(kind, row) {
  return JSON.stringify((kind === 'subjects' ? [row.ten, row.hocKy] : [row.tenMon, row.hocKy, row.thu, row.gioBatDau, row.gioKetThuc]).map((value) => typeof value === 'string' ? value.normalize('NFC').toLocaleLowerCase('vi') : value));
}

// Reject oversized compressed workbooks before ExcelJS expands their contents.
function checkWorkbookSize(buffer) {
  let end = buffer.length - 22;
  while (end >= Math.max(0, buffer.length - 65557) && buffer.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0 || end < buffer.length - 65557) throw new Error('Tệp Excel không hợp lệ.');
  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  let total = 0;
  if (count > 200) throw new Error('Tệp Excel quá phức tạp. Dùng mẫu nhập đơn giản.');
  for (let index = 0; index < count; index++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Tệp Excel không hợp lệ.');
    total += buffer.readUInt32LE(offset + 24);
    if (total > 12 * 1024 * 1024) throw new Error('Nội dung Excel sau giải nén quá lớn.');
    offset += 46 + buffer.readUInt16LE(offset + 28) + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
  }
}

async function parseUpload({ kind, filename, content }) {
  if (!columns[kind]) throw new Error('Loại dữ liệu nhập không hợp lệ.');
  if (typeof filename !== 'string' || !/\.(csv|xlsx)$/i.test(filename)) throw new Error('Chỉ nhận .csv hoặc .xlsx.');
  if (typeof content !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(content) || content.length > 1400000) throw new Error('Tệp không hợp lệ hoặc lớn hơn 1 MB.');
  const buffer = Buffer.from(content, 'base64');
  if (!buffer.length || buffer.length > 1024 * 1024) throw new Error('Tệp rỗng hoặc lớn hơn 1 MB.');
  const workbook = new ExcelJS.Workbook();
  let sheet;
  if (/\.xlsx$/i.test(filename)) {
    checkWorkbookSize(buffer);
    await workbook.xlsx.load(buffer);
    if (workbook.worksheets.length !== 1) throw new Error('Tệp nhập cần có đúng một trang tính.');
    sheet = workbook.worksheets[0];
  } else {
    const source = buffer.toString('utf8').replace(/^\uFEFF/, '');
    const firstLine = source.split(/\r?\n/)[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    sheet = await workbook.csv.read(Readable.from([source]), { map: (value) => value, parserOptions: { delimiter, maxRows: 502 } });
  }
  if (!sheet || sheet.rowCount < 2 || sheet.rowCount > 501) throw new Error('Mỗi tệp cần có 1–500 dòng dữ liệu và một dòng tiêu đề.');
  const headers = sheet.getRow(1).values.slice(1).map(text);
  if (JSON.stringify(headers) !== JSON.stringify(columns[kind])) throw new Error(`Dùng các cột đúng thứ tự: ${columns[kind].join(', ')}.`);
  const rows = [];
  const seen = new Set();
  sheet.eachRow((row, number) => {
    if (number === 1) return;
    const data = {};
    const errors = [];
    try {
      if (row.cellCount > columns[kind].length) errors.push('Dòng có thừa cột dữ liệu.');
      columns[kind].forEach((key, index) => {
        const cell = row.getCell(index + 1);
        if (cell.isMerged) throw new Error('Không dùng ô gộp.');
        const value = cell.value;
        data[key] = ['tinChi', 'thu'].includes(key) ? Number(text(value)) : key.startsWith('gio') ? time(value) : text(value);
      });
      errors.push(...validateRow(kind, data));
    } catch (error) { errors.push(error.message); }
    const key = rowKey(kind, data);
    if (seen.has(key)) errors.push('Trùng với một dòng khác trong tệp.');
    seen.add(key);
    rows.push({ line: number, data, errors, skip: false });
  });
  return { kind, columns: columns[kind], rows };
}

async function checkExisting(client, userId, preview) {
  const model = preview.kind === 'subjects' ? client.monHoc : client.thoiKhoaBieu;
  const existing = await model.findMany({ where: { idNguoiDung: userId } });
  const keys = new Set(existing.map((row) => rowKey(preview.kind, row)));
  return { ...preview, rows: preview.rows.map((row) => ({ ...row, skip: !row.errors.length && keys.has(rowKey(preview.kind, row.data)) })) };
}

async function commitImport(prisma, userId, preview) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const checked = await checkExisting(tx, userId, preview);
        if (checked.rows.some((row) => row.errors.length)) {
          const error = new Error('Cần sửa các dòng lỗi trước khi nhập. Chưa lưu dòng nào.');
          error.preview = checked;
          throw error;
        }
        const data = checked.rows.filter((row) => !row.skip).map((row) => ({ ...row.data, idNguoiDung: userId }));
        if (checked.kind === 'timetable' && data.length) {
          const schedules = await tx.thoiKhoaBieu.findMany({ where: { idNguoiDung: userId } });
          for (const row of data) {
            if (schedules.some(other => overlaps(row, other))) throw new Error(`Lịch của ${row.tenMon} bị trùng giờ. Chưa nhập dòng nào.`);
            schedules.push(row);
          }
        }
        if (data.length) await (checked.kind === 'subjects' ? tx.monHoc : tx.thoiKhoaBieu).createMany({ data });
        return { count: data.length, skipped: checked.rows.length - data.length };
      }, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (error.code === 'P2034' && attempt < 2) continue;
      throw error;
    }
  }
}
module.exports = { columns, parseUpload, validateRow, rowKey, checkExisting, commitImport };
