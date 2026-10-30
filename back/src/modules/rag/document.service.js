const path = require('path');
const { fork } = require('child_process');
const prisma = require('../../prismaClient');
const { serializable, httpError } = require('../../utils/transaction.util');
const { LIMITS, clean, chunkPages, contentHash } = require('./rag.text');
const guide = require('./lifehub-guide');
let parsing = 0;
async function parsePdf(buffer) {
  if (parsing >= 2) throw httpError(429, 'Đang đọc tài liệu khác. Hãy thử lại sau ít giây.');
  parsing++;
  try {
    return await new Promise((resolve, reject) => {
      const worker = fork(path.join(__dirname, 'pdf.worker.js'), [], { windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'], execArgv: ['--max-old-space-size=128'], env: Object.fromEntries(['SystemRoot', 'WINDIR', 'PATH', 'TEMP', 'TMP'].filter(key => process.env[key]).map(key => [key, process.env[key]])) });
      let finished = false;
      const finish = (error, result) => {
        if (finished) return;
        finished = true; clearTimeout(timer); worker.kill();
        error ? reject(error) : resolve(result);
      };
      const timer = setTimeout(() => finish(httpError(422, 'PDF đọc quá lâu. Hãy chia thành tệp nhỏ hơn hoặc dán nội dung dạng chữ.')), 15000);
      worker.once('message', message => {
        const messages = { PAGE_LIMIT: 'PDF tối đa 100 trang.', TEXT_LIMIT: 'Tài liệu tối đa 200.000 ký tự.', PASSWORD: 'PDF có mật khẩu. Hãy dùng bản đã mở khóa.', INVALID: 'Không đọc được PDF. Hãy kiểm tra tệp hoặc dán nội dung dạng chữ.' };
        finish(message.error ? httpError(422, messages[message.error]) : null, message.pages);
      });
      worker.once('error', () => finish(httpError(422, 'Không đọc được PDF. Hãy dùng tệp nhỏ hơn hoặc dán nội dung dạng chữ.')));
      worker.once('exit', () => { if (!finished) finish(httpError(422, 'Quá trình đọc PDF bị dừng. Hãy thử tệp khác.')); });
      worker.send(buffer.toString('base64'), error => { if (error) finish(httpError(422, 'Không khởi chạy được trình đọc PDF.')); });
    });
  } finally { parsing--; }
}
async function extractInput(body) {
  if (!body || typeof body.tieuDe !== 'string' || !body.tieuDe.trim() || body.tieuDe.trim().length > 160) throw httpError(400, 'Tên tài liệu cần từ 1 đến 160 ký tự.');
  let pages, tenTep = 'Nội dung đã nhập';
  if (body.tep !== undefined) {
    const file = body.tep;
    if (!file || typeof file.ten !== 'string' || file.ten.length > 200 || !/\.(pdf|txt|md)$/i.test(file.ten)
      || typeof file.base64 !== 'string' || file.base64.length > Math.ceil(LIMITS.fileBytes / 3) * 4
      || (file.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64))) throw httpError(400, 'Chọn PDF, TXT hoặc MD, tối đa 4 MB.');
    const buffer = Buffer.from(file.base64, 'base64');
    if (!buffer.length || buffer.length > LIMITS.fileBytes) throw httpError(400, 'Tệp trống hoặc vượt 4 MB.');
    tenTep = file.ten.replace(/.*[\\/]/, '');
    if (/\.pdf$/i.test(tenTep)) {
      if (buffer.subarray(0, 5).toString() !== '%PDF-') throw httpError(400, 'Tệp không có định dạng PDF hợp lệ.');
      pages = await parsePdf(buffer);
    } else {
      let text;
      try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
      catch { throw httpError(422, 'TXT/MD cần dùng mã hóa UTF-8. Bạn có thể dán nội dung vào ô bên dưới.'); }
      pages = [{ page: 1, text }];
    }
  } else {
    if (typeof body.noiDung !== 'string') throw httpError(400, 'Chọn tệp hoặc nhập nội dung tài liệu.');
    pages = [{ page: 1, text: body.noiDung }];
  }
  pages = pages.map(p => ({ ...p, text: clean(p.text) }));
  const count = pages.reduce((n, p) => n + p.text.length, 0);
  if (count < 40) throw httpError(422, 'Chưa đủ chữ để đọc. PDF dạng ảnh chưa được hỗ trợ; hãy dùng PDF có chữ hoặc dán nội dung ít nhất 40 ký tự.');
  if (count > LIMITS.documentChars) throw httpError(413, 'Tài liệu tối đa 200.000 ký tự.');
  return { tieuDe: body.tieuDe.trim(), tenTep, soTrang: pages.length, soKyTu: count, bamNoiDung: contentHash(pages), cacDoan: chunkPages(pages) };
}
const metadata = { id: true, tieuDe: true, tenTep: true, soTrang: true, soKyTu: true, ngayTao: true };
async function listDocuments(idNguoiDung) {
  const taiLieus = await prisma.taiLieuRag.findMany({ where: { idNguoiDung }, select: metadata, orderBy: [{ ngayTao: 'desc' }, { id: 'desc' }] });
  return { taiLieus, huongDan: { id: guide.id, tieuDe: guide.tieuDe, tenTep: guide.tenTep, soTrang: guide.soTrang, macDinh: true }, gioiHan: { soTaiLieu: LIMITS.documents, tongKyTu: LIMITS.totalChars, kyTuDaDung: taiLieus.reduce((n, d) => n + d.soKyTu, 0) } };
}
async function addDocument(idNguoiDung, body) {
  const data = await extractInput(body);
  try {
    return await serializable(prisma, async tx => {
      const all = await tx.taiLieuRag.findMany({ where: { idNguoiDung }, select: { soKyTu: true, bamNoiDung: true } });
      if (all.some(d => d.bamNoiDung === data.bamNoiDung)) throw httpError(409, 'Nội dung tài liệu này đã có trong kho.');
      if (all.length >= LIMITS.documents || all.reduce((n, d) => n + d.soKyTu, 0) + data.soKyTu > LIMITS.totalChars) throw httpError(409, 'Kho tối đa 20 tài liệu và 600.000 ký tự. Hãy xóa tài liệu không còn dùng.');
      return tx.taiLieuRag.create({ data: { ...data, idNguoiDung }, select: metadata });
    });
  } catch (error) {
    if (error.code === 'P2002') throw httpError(409, 'Nội dung tài liệu này đã có trong kho.');
    throw error;
  }
}
async function readDocument(idNguoiDung, id) {
  if (id === guide.id) return guide;
  const doc = await prisma.taiLieuRag.findFirst({ where: { idNguoiDung, id: Number(id) }, select: { ...metadata, cacDoan: true } });
  if (!doc) throw httpError(404, 'Không tìm thấy tài liệu.');
  return doc;
}
async function deleteDocument(idNguoiDung, id) {
  const result = await prisma.taiLieuRag.deleteMany({ where: { idNguoiDung, id: Number(id) } });
  if (!result.count) throw httpError(404, 'Không tìm thấy tài liệu.');
}
async function searchableDocuments(idNguoiDung) {
  const docs = await prisma.taiLieuRag.findMany({ where: { idNguoiDung }, select: { id: true, tieuDe: true, tenTep: true, cacDoan: true }, orderBy: { id: 'asc' } });
  return [...docs, guide];
}
module.exports = { listDocuments, addDocument, readDocument, deleteDocument, searchableDocuments, extractInput };
