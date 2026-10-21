// Manual, non-production audit. Known failures are recorded rather than hidden.
// Run only against the disposable database created for this audit.
const path = require('node:path');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const backendRoot = process.env.SLH_AUDIT_BASELINE === 'true'
  ? path.resolve(__dirname, '../../improvement-backups/functional-audit-20261020/baseline/back')
  : path.resolve(__dirname, '..');
const database = new URL(process.env.DATABASE_URL || 'postgresql://invalid');
if (database.hostname !== '127.0.0.1' || database.port !== '55439' || !['/slh_functional_audit', '/slh_bugfix_20261021'].includes(database.pathname)) {
  throw new Error('Refusing to run outside the isolated audit database.');
}
process.env.NODE_ENV = 'test';
process.env.ENABLE_CRON_JOBS = 'false';
process.env.GEMINI_API_KEY = '';
process.env.TRUST_PROXY = 'true'; // Supertest only: a separate source IP per case.
process.env.JWT_SECRET = 'isolated-functional-audit-only-signing-key';
process.env.FRONTEND_URL = 'http://127.0.0.1:5081';
const mailPath = require.resolve(path.join(backendRoot, 'src/utils/email.util'));
const capturedMail = [];
let failMail = false;
require.cache[mailPath] = { id: mailPath, filename: mailPath, loaded: true, exports: {
  escapeHtml: s => String(s || '').replace(/[<>&"']/g, ''),
  guiEmail: async data => { if (failMail) throw new Error('Simulated delivery outage'); capturedMail.push(data); },
  guiEmailDatLaiMatKhau: async (to, name, link) => {
    if (failMail) throw new Error('Simulated delivery outage');
    capturedMail.push({ to, link });
  },
} };
const request = require('supertest');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const app = require(path.join(backendRoot, 'app'));
const prisma = require(path.join(backendRoot, 'src/prismaClient'));
const results = [];
const userIds = [];
const prefix = `audit-${randomUUID()}`;
let ip = 0;
let accountA, accountB, subject, grade1, grade2, task, lesson, transaction;
let tokenA, tokenB;
const password = 'Audit-test-only-2026';
const emailA = `${prefix}-a@example.invalid`;
const emailB = `${prefix}-b@example.invalid`;
const now = new Date();
const period = { thang: now.getMonth() + 1, nam: now.getFullYear() };
const later = new Date(Date.now() + 3600_000).toISOString();
const call = (method, url, body, token, fixedIp) => {
  let req = request(app)[method](url).set('X-Forwarded-For', fixedIp || `127.2.${Math.floor(++ip / 250)}.${ip % 250 + 1}`);
  if (token) req = req.set('Authorization', `Bearer ${token}`);
  if (body !== undefined) req = req.send(body);
  return req;
};
async function check(name, expected, action, verify = r => r.status === expected) {
  try {
    const value = await action();
    const pass = Boolean(await verify(value));
    results.push({ name, expected, actual: value.status ?? value, pass });
    if (!pass) console.log(`FAIL ${name}: expected ${JSON.stringify(expected)}, actual ${JSON.stringify(value.status ?? value)}`);
    return value;
  } catch (error) {
    results.push({ name, expected, actual: error.code || error.name, pass: false });
    console.log(`ERROR ${name}: ${error.code || error.name}`);
  }
}
const originalError = console.error;
let loggedErrors = 0;
console.error = () => { loggedErrors++; }; // Avoid printing input secrets in expected server errors.
async function main() {
  await check('Health and database', 200, () => call('get', '/api/health'));
  for (const [email, name] of [[emailA, 'Audit Owner'], [emailB, 'Audit Other']]) {
    await check(`Register ${name}`, 201, () => call('post', '/api/auth/dang-ky', { email, ten: name, matKhau: password }));
    const user = await prisma.nguoiDung.findUnique({ where: { email } });
    userIds.push(user.id);
    if (email === emailA) accountA = user; else accountB = user;
  }
  const loginA = await check('Login normalized email', 200, () => call('post', '/api/auth/dang-nhap', { email: ` ${emailA.toUpperCase()} `, matKhau: password }));
  tokenA = loginA.body.token;
  const loginB = await check('Login second user', 200, () => call('post', '/api/auth/dang-nhap', { email: emailB, matKhau: password }));
  tokenB = loginB.body.token;
  await check('Login redacts password/reset secrets', true, async () => !['matKhau', 'resetPasswordToken', 'resetPasswordExpiry'].some(key => key in loginA.body.user), x => x === true);
  await check('Duplicate email', 400, () => call('post', '/api/auth/dang-ky', { email: emailA, ten: 'Duplicate', matKhau: password }));
  await check('Wrong password', 400, () => call('post', '/api/auth/dang-nhap', { email: emailA, matKhau: 'incorrect' }));
  await check('Missing authentication', 401, () => call('get', '/api/academic/mon-hoc'));
  await check('Expired JWT', 403, () => call('get', '/api/auth/ho-so', undefined, jwt.sign({ id: accountA.id }, process.env.JWT_SECRET, { expiresIn: -10 })));
  await check('Read profile', 200, () => call('get', '/api/auth/ho-so', undefined, tokenA));
  await check('Update profile', 200, () => call('put', '/api/auth/ho-so', { ten: 'Audit Updated', truong: 'Test School' }, tokenA), r => r.status === 200 && r.body.user.ten === 'Audit Updated');
  await check('Reject null profile name', 400, () => call('put', '/api/auth/ho-so', { ten: null }, tokenA));
  await check('Reject whitespace profile name', 400, () => call('put', '/api/auth/ho-so', { ten: '   ' }, tokenA));
  await call('put', '/api/auth/ho-so', { ten: 'Audit Updated' }, tokenA);
  await check('Reject non-string login email', 400, () => call('post', '/api/auth/dang-nhap', { email: 123, matKhau: password }));
  await check('Reject non-string registration password', 400, () => call('post', '/api/auth/dang-ky', { email: `${prefix}-bad@example.invalid`, ten: 'Bad', matKhau: 123456 }));
  await check('Authentication rate limit', 429, async () => {
    let response;
    for (let i = 0; i < 11; i++) response = await call('post', '/api/auth/dang-nhap', {}, undefined, '127.3.0.1');
    return response;
  });

  await check('Create subject', 201, async () => {
    const r = await call('post', '/api/academic/mon-hoc', { ten: 'Cơ sở dữ liệu', tinChi: 3, hocKy: 'HK1 Audit' }, tokenA);
    subject = r.body.monHoc; return r;
  });
  await check('Read semester subjects', 200, () => call('get', '/api/academic/mon-hoc?hocKy=HK1%20Audit', undefined, tokenA), r => r.status === 200 && r.body.monHocs.some(s => s.id === subject.id));
  await check('Other user cannot read subjects', 200, () => call('get', '/api/academic/mon-hoc', undefined, tokenB), r => r.status === 200 && !r.body.monHocs.some(s => s.id === subject.id));
  for (const method of ['put', 'delete']) await check(`Other user cannot ${method} subject`, 404, () => call(method, `/api/academic/mon-hoc/${subject.id}`, method === 'put' ? { ten: 'Unauthorized' } : undefined, tokenB));
  await check('Update subject', 200, () => call('put', `/api/academic/mon-hoc/${subject.id}`, { ten: 'Cơ sở dữ liệu audit', tinChi: 3 }, tokenA));
  await check('Reject fractional credits', 400, () => call('post', '/api/academic/mon-hoc', { ten: 'Bad', tinChi: 1.5, hocKy: 'HK1' }, tokenA));
  await check('Reject blank subject title', 400, () => call('post', '/api/academic/mon-hoc', { ten: '   ', tinChi: 3, hocKy: 'HK1' }, tokenA));
  await check('Add grade 8 at 40%', 201, async () => { const r = await call('post', '/api/academic/diem', { idMonHoc: subject.id, loaiDanhGia: 'Giữa kỳ', diem: 8, trongSo: 40 }, tokenA); grade1 = r.body.diem; return r; });
  await check('Predict remaining 60% for target 7', '6.33', () => call('post', `/api/academic/mon-hoc/${subject.id}/du-doan`, { mucTieu: 7, trongSoConLai: 60 }, tokenA), r => r.status === 200 && r.body.diemCanDat === '6.33');
  await check('Add grade 6 at 60%', 201, async () => { const r = await call('post', '/api/academic/diem', { idMonHoc: subject.id, loaiDanhGia: 'Cuối kỳ', diem: 6, trongSo: 60 }, tokenA); grade2 = r.body.diem; return r; });
  await check('Weighted GPA equals 6.80', '6.80', () => call('get', '/api/academic/gpa', undefined, tokenA), r => r.status === 200 && r.body.gpa === '6.80');
  await check('GPA by semester', 200, () => call('get', '/api/academic/gpa-theo-ky', undefined, tokenA), r => r.status === 200 && r.body.theoKy.some(s => s.gpa === '6.80'));
  await check('Academic warnings', 200, () => call('get', '/api/academic/canh-bao', undefined, tokenA), r => r.status === 200 && Array.isArray(r.body.monNguyCo));
  await check('Reject grade above 10', 400, () => call('put', `/api/academic/diem/${grade1.id}`, { diem: 11 }, tokenA));
  await check('Other user cannot update grade', 404, () => call('put', `/api/academic/diem/${grade1.id}`, { diem: 1 }, tokenB));
  await check('Reject total weights over 100%', 400, () => call('put', `/api/academic/diem/${grade2.id}`, { trongSo: 70 }, tokenA));
  await call('put', `/api/academic/diem/${grade2.id}`, { trongSo: 60 }, tokenA);
  await check('Reject malformed numeric subject ID', 400, () => call('put', `/api/academic/mon-hoc/${subject.id}junk`, { ten: 'Malformed ID accepted' }, tokenA));
  await check('Export PDF signature', '%PDF', () => call('get', '/api/academic/xuat-bang-diem', undefined, tokenA), r => {
    const bytes = Buffer.isBuffer(r.body) ? r.body : Buffer.from(r.text || '');
    if (r.status === 200) fs.writeFileSync(path.resolve(__dirname, '../../improvement-backups/functional-audit-20261020/grades.pdf'), bytes);
    return r.status === 200 && bytes.subarray(0, 4).toString() === '%PDF';
  });

  await check('Create deadline with checklist', 201, async () => { const r = await call('post', '/api/deadline', { tieuDe: 'Nộp đồ án audit', hanChot: later, idMonHoc: subject.id, checklist: [{ id: 'step', title: 'Viết báo cáo', done: false }] }, tokenA); task = r.body.deadline; return r; });
  await check('List upcoming deadlines', 200, () => call('get', '/api/deadline/sap-toi', undefined, tokenA));
  await check('Semester deadline filter', 200, () => call('get', '/api/deadline?hocKy=HK1%20Audit', undefined, tokenA), r => r.status === 200 && r.body.deadlines.some(d => d.id === task.id));
  await check('Other user cannot change deadline', 404, () => call('put', `/api/deadline/${task.id}`, { tieuDe: 'Unauthorized' }, tokenB));
  await check('Update checklist', 200, () => call('put', `/api/deadline/${task.id}`, { checklist: [{ id: 'step', title: 'Viết báo cáo', done: true }] }, tokenA), r => r.status === 200 && r.body.deadline.checklist[0].done);
  await check('Bell includes upcoming deadline', 200, () => call('get', '/api/thong-bao', undefined, tokenA), r => r.status === 200 && r.body.thongBaos.some(n => n.id === `deadline-${task.id}`));
  await check('Complete deadline', 200, () => call('patch', `/api/deadline/${task.id}/hoan-thanh`, undefined, tokenA), r => r.status === 200 && r.body.deadline.trangThai === 'hoan_thanh');
  await check('Completed deadline removed from bell', 200, () => call('get', '/api/thong-bao', undefined, tokenA), r => r.status === 200 && !r.body.thongBaos.some(n => n.id === `deadline-${task.id}`));
  await check('Reopen deadline', 200, () => call('put', `/api/deadline/${task.id}`, { trangThai: 'dang_dien_hanh' }, tokenA));
  await check('Reject invalid deadline date', 400, () => call('post', '/api/deadline', { tieuDe: 'Bad', hanChot: 'not-a-date' }, tokenA));
  await check('Reject blank deadline title', 400, () => call('post', '/api/deadline', { tieuDe: '   ', hanChot: later }, tokenA));
  await check('Reject empty deadline status', 400, () => call('put', `/api/deadline/${task.id}`, { trangThai: '' }, tokenA));
  await call('put', `/api/deadline/${task.id}`, { trangThai: 'dang_dien_hanh' }, tokenA);
  await check('Reject null updated deadline date', 400, () => call('put', `/api/deadline/${task.id}`, { hanChot: null }, tokenA));

  const schedule = { tenMon: 'Cơ sở dữ liệu audit', thu: 2, gioBatDau: '07:00', gioKetThuc: '09:00', hocKy: 'HK1 Audit', phongHoc: 'A101' };
  await check('Create class', 201, async () => { const r = await call('post', '/api/thoi-khoa-bieu', schedule, tokenA); lesson = r.body.buoiHoc; return r; });
  await check('Read semester timetable', 200, () => call('get', '/api/thoi-khoa-bieu?hocKy=HK1%20Audit', undefined, tokenA), r => r.status === 200 && r.body.thoiKhoaBieu.some(l => l.id === lesson.id));
  await check('Update class room', 200, () => call('put', `/api/thoi-khoa-bieu/${lesson.id}`, { phongHoc: 'A102' }, tokenA));
  await check('Reject reversed class hours', 400, () => call('put', `/api/thoi-khoa-bieu/${lesson.id}`, { gioBatDau: '10:00' }, tokenA));
  await check('Reject invalid class time', 400, () => call('post', '/api/thoi-khoa-bieu', { ...schedule, gioBatDau: '25:00' }, tokenA));
  await check('Other user cannot delete class', 404, () => call('delete', `/api/thoi-khoa-bieu/${lesson.id}`, undefined, tokenB));
  await check('Reject overlapping class', 409, () => call('post', '/api/thoi-khoa-bieu', { ...schedule, tenMon: 'Lịch trùng', gioBatDau: '08:00', gioKetThuc: '10:00' }, tokenA));
  await check('Allow adjacent class', 201, () => call('post', '/api/thoi-khoa-bieu', { ...schedule, gioBatDau: '09:00', gioKetThuc: '10:00' }, tokenA));

  await check('Create income', 201, () => call('post', '/api/finance/giao-dich', { loai: 'thu', danhMuc: 'luong', soTien: 1000000, moTa: 'Audit income' }, tokenA));
  await check('Create expense', 201, async () => { const r = await call('post', '/api/finance/giao-dich', { loai: 'chi', danhMuc: 'an_uong', soTien: 50000, moTa: 'Audit expense' }, tokenA); transaction = r.body.giaoDich; return r; });
  await check('Finance totals match arithmetic', 950000, () => call('get', `/api/finance/thong-ke?thang=${period.thang}&nam=${period.nam}`, undefined, tokenA), r => r.status === 200 && r.body.soDu === 950000);
  await check('Edit expense amount', 200, () => call('put', `/api/finance/giao-dich/${transaction.id}`, { soTien: 60000 }, tokenA));
  await check('Finance totals after edit', 940000, () => call('get', `/api/finance/thong-ke?thang=${period.thang}&nam=${period.nam}`, undefined, tokenA), r => r.status === 200 && r.body.soDu === 940000);
  await check('Other user cannot edit expense', 404, () => call('put', `/api/finance/giao-dich/${transaction.id}`, { soTien: 1 }, tokenB));
  await check('Other user cannot delete expense', 404, () => call('delete', `/api/finance/giao-dich/${transaction.id}`, undefined, tokenB));
  await check('Other user cannot delete grade', 404, () => call('delete', `/api/academic/diem/${grade1.id}`, undefined, tokenB));
  await check('Other user cannot complete deadline', 404, () => call('patch', `/api/deadline/${task.id}/hoan-thanh`, undefined, tokenB));
  await check('Other user cannot delete deadline', 404, () => call('delete', `/api/deadline/${task.id}`, undefined, tokenB));
  await check('Other user cannot attach foreign subject', 404, () => call('post', '/api/deadline', { tieuDe: 'Foreign subject', hanChot: later, idMonHoc: subject.id }, tokenB));
  await check('Other user cannot see timetable', 200, () => call('get', '/api/thoi-khoa-bieu', undefined, tokenB), r => r.status === 200 && r.body.thoiKhoaBieu.length === 0);
  await check('Other user cannot see transactions', 200, () => call('get', '/api/finance/giao-dich', undefined, tokenB), r => r.status === 200 && r.body.giaoDichs.length === 0);
  await check('Search and pagination', 200, () => call('get', '/api/finance/giao-dich?q=Audit%20expense&trang=1&soLuong=1', undefined, tokenA), r => r.status === 200 && r.body.giaoDichs.length === 1 && r.body.tongSo === 1);
  await check('Reject negative amount', 400, () => call('post', '/api/finance/giao-dich', { loai: 'chi', danhMuc: 'an_uong', soTien: -1 }, tokenA));
  await check('Reject amount with trailing letters', 400, () => call('post', '/api/finance/giao-dich', { loai: 'chi', danhMuc: 'an_uong', soTien: '100oops' }, tokenA));
  await check('Reject expense in income category', 400, () => call('post', '/api/finance/giao-dich', { loai: 'chi', danhMuc: 'luong', soTien: 100 }, tokenA));
  await check('Reject invalid finance month', 400, () => call('get', '/api/finance/thong-ke?thang=13&nam=2026', undefined, tokenA));
  await check('Reject malformed page', 400, () => call('get', '/api/finance/giao-dich?trang=oops&soLuong=10', undefined, tokenA));
  await check('Create budget', 200, () => call('post', '/api/finance/ngan-sach', { danhMuc: 'an_uong', soTienToiDa: 40000, ...period }, tokenA));
  await check('Update same budget', 200, () => call('post', '/api/finance/ngan-sach', { danhMuc: 'an_uong', soTienToiDa: 50000, ...period }, tokenA));
  await check('Budget unique and correctly overspent', 200, () => call('get', `/api/finance/ngan-sach?thang=${period.thang}&nam=${period.nam}`, undefined, tokenA), r => r.status === 200 && r.body.ketQua.length === 1 && r.body.ketQua[0].daChi === 60000 && r.body.ketQua[0].vuotNganSach);
  await check('Other user cannot see budgets', 200, () => call('get', '/api/finance/ngan-sach', undefined, tokenB), r => r.status === 200 && r.body.ketQua.length === 0);
  await check('Finance trend', 200, () => call('get', '/api/finance/xu-huong?soThang=6', undefined, tokenA));
  await check('Export Excel opens as workbook', true, async () => {
    const r = await call('get', `/api/finance/xuat-bao-cao?thang=${period.thang}&nam=${period.nam}`, undefined, tokenA).buffer(true).parse((res, done) => {
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => done(null, Buffer.concat(chunks))); res.on('error', done);
    });
    if (r.status !== 200 || !Buffer.isBuffer(r.body)) return false;
    const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(r.body);
    fs.writeFileSync(path.resolve(__dirname, '../../improvement-backups/functional-audit-20261020/finance.xlsx'), r.body);
    return workbook.worksheets.length > 0;
  }, x => x === true);

  for (const kind of ['subjects', 'timetable']) {
    const csv = kind === 'subjects' ? 'ten,tinChi,hocKy\nImported Audit,2,HK2 Audit' : 'tenMon,thu,gioBatDau,gioKetThuc,phongHoc,giangVien,hocKy\nImported Class,3,10:00,11:00,A103,Audit Teacher,HK2 Audit';
    const payload = { kind, filename: `${kind}.csv`, content: Buffer.from(csv).toString('base64') };
    await check(`Preview ${kind} CSV`, 200, () => call('post', '/api/imports/preview', payload, tokenA), r => r.status === 200 && r.body.rows.length === 1 && r.body.rows[0].errors.length === 0);
    await check(`Commit ${kind} CSV`, 1, () => call('post', '/api/imports/commit', payload, tokenA), r => r.status === 200 && r.body.count === 1);
    await check(`Repeated ${kind} import skips duplicates`, 1, () => call('post', '/api/imports/commit', payload, tokenA), r => r.status === 200 && r.body.skipped === 1 && r.body.count === 0);
  }
  await check('Invalid import rejected without partial write', 400, () => call('post', '/api/imports/commit', { kind: 'subjects', filename: 'bad.csv', content: Buffer.from('ten,tinChi,hocKy\nInvalid,0,HK1').toString('base64') }, tokenA));
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Subjects').addRows([['ten', 'tinChi', 'hocKy'], ['Excel Imported Audit', 2, 'HK2 Audit']]);
  const excelPayload = { kind: 'subjects', filename: 'subjects.xlsx', content: Buffer.from(await workbook.xlsx.writeBuffer()).toString('base64') };
  await check('Preview XLSX subject import', 200, () => call('post', '/api/imports/preview', excelPayload, tokenA), r => r.status === 200 && r.body.rows[0].errors.length === 0);
  await check('Commit XLSX subject import', 1, () => call('post', '/api/imports/commit', excelPayload, tokenA), r => r.status === 200 && r.body.count === 1);
  await check('Protected route families require login', true, async () => {
    const endpoints = [
      ['get', '/api/auth/ho-so'], ['put', '/api/auth/ho-so'], ['put', '/api/auth/doi-mat-khau'], ['put', '/api/auth/doi-email'],
      ['get', '/api/academic/mon-hoc'], ['post', '/api/academic/mon-hoc'], ['get', '/api/academic/gpa'], ['get', '/api/academic/gpa-theo-ky'], ['get', '/api/academic/canh-bao'], ['get', '/api/academic/xuat-bang-diem'],
      ['post', '/api/academic/diem'], ['post', `/api/academic/mon-hoc/${subject.id}/du-doan`],
      ['get', '/api/deadline'], ['get', '/api/deadline/sap-toi'], ['post', '/api/deadline'],
      ['get', '/api/thoi-khoa-bieu'], ['post', '/api/thoi-khoa-bieu'],
      ['get', '/api/finance/giao-dich'], ['post', '/api/finance/giao-dich'], ['get', '/api/finance/thong-ke'], ['get', '/api/finance/ngan-sach'], ['post', '/api/finance/ngan-sach'], ['get', '/api/finance/xu-huong'], ['get', '/api/finance/xuat-bao-cao'],
      ['get', '/api/thong-bao'], ['post', '/api/thong-bao/test-cron/deadline'], ['post', '/api/thong-bao/test-cron/ngan-sach'],
      ['post', '/api/imports/preview'], ['post', '/api/imports/commit'], ['post', '/api/chatbot/hoi-dap'],
    ];
    const statuses = [];
    for (const [method, route] of endpoints) statuses.push((await call(method, route, method === 'get' ? undefined : {})).status);
    return statuses.every(s => s === 401);
  }, x => x === true);
  await check('Database outage keeps session distinguishable', 503, async () => {
    const original = prisma.nguoiDung.findUnique;
    prisma.nguoiDung.findUnique = async () => { throw new Error('Simulated database outage'); };
    try { return await call('get', '/api/auth/ho-so', undefined, tokenA); }
    finally { prisma.nguoiDung.findUnique = original; }
  });
  await check('Vietnam month boundary under UTC server', true, async () => {
    const originalZone = process.env.TZ;
    const boundary = await prisma.giaoDich.create({ data: { idNguoiDung: accountB.id, loai: 'chi', danhMuc: 'an_uong', soTien: 12345, ngayGiaoDich: new Date('2026-10-01T00:30:00+07:00') } });
    process.env.TZ = 'UTC';
    try {
      const r = await call('get', '/api/finance/giao-dich?thang=10&nam=2026', undefined, tokenB);
      return r.status === 200 && r.body.giaoDichs.some(g => g.id === boundary.id);
    } finally {
      if (originalZone === undefined) delete process.env.TZ; else process.env.TZ = originalZone;
      await prisma.giaoDich.delete({ where: { id: boundary.id } });
    }
  }, x => x === true);
  await check('Reject empty chatbot message', 400, () => call('post', '/api/chatbot/hoi-dap', { tinNhan: '' }, tokenA));
  await check('Reject wrong chatbot message type', 400, () => call('post', '/api/chatbot/hoi-dap', { tinNhan: 123 }, tokenA));
  await check('Chatbot reports service unconfigured', 200, () => call('post', '/api/chatbot/hoi-dap', { tinNhan: 'Lịch hôm nay?' }, tokenA), r => r.status === 200 && r.body.daCauHinh === false);
  const beforeCron = capturedMail.length;
  await check('Deadline cron simulation scoped to caller', true, async () => {
    const r = await call('post', '/api/thong-bao/test-cron/deadline', {}, tokenA);
    return r.status === 200 && capturedMail.length > beforeCron && capturedMail.slice(beforeCron).every(m => m.to === emailA);
  }, x => x === true);
  await check('Budget cron simulation scoped to caller', true, async () => {
    const count = capturedMail.length;
    const r = await call('post', '/api/thong-bao/test-cron/ngan-sach', {}, tokenA);
    return r.status === 200 && capturedMail.length > count && capturedMail.slice(count).every(m => m.to === emailA);
  }, x => x === true);
  failMail = true;
  await check('Cron reports simulated mail delivery failure', 'non-2xx', () => call('post', '/api/thong-bao/test-cron/deadline', {}, tokenA), r => r.status >= 400);
  failMail = false;

  await check('Forgot password generic unknown user', 200, () => call('post', '/api/auth/quen-mat-khau', { email: `${prefix}-missing@example.invalid` }));
  await check('Forgot password with captured mail', 200, () => call('post', '/api/auth/quen-mat-khau', { email: emailA }));
  const reset1 = new URL(capturedMail.findLast(m => m.link).link).searchParams.get('token');
  const changed = await check('Change password issues replacement JWT', 200, () => call('put', '/api/auth/doi-mat-khau', { matKhauCu: password, matKhauMoi: `${password}-new` }, tokenA));
  tokenA = changed.body.token;
  await check('Old JWT invalid after password change', 403, () => call('get', '/api/auth/ho-so', undefined, loginA.body.token));
  await check('Old reset link invalid after password change', 400, () => call('post', '/api/auth/dat-lai-mat-khau', { email: emailA, token: reset1, matKhauMoi: `${password}-reset` }));
  // A successful old-link reset is a finding, so use user B for further account checks.
  await check('Change email with password', 200, () => call('put', '/api/auth/doi-email', { emailMoi: `${prefix}-changed@example.invalid`, matKhau: password }, tokenB));
  const updatedEmailB = `${prefix}-changed@example.invalid`;
  await check('Request reset after email change', 200, () => call('post', '/api/auth/quen-mat-khau', { email: updatedEmailB }));
  let reset2 = new URL(capturedMail.findLast(m => m.link).link).searchParams.get('token');
  const normalizedReset = await check('Reset link handles normalized email', 200, () => call('post', '/api/auth/dat-lai-mat-khau', { email: updatedEmailB.toUpperCase(), token: reset2, matKhauMoi: `${password}-reset` }));
  if (normalizedReset.status === 200) {
    await call('post', '/api/auth/quen-mat-khau', { email: updatedEmailB });
    reset2 = new URL(capturedMail.findLast(m => m.link).link).searchParams.get('token');
  }
  await check('Reset password with original email casing', 200, () => call('post', '/api/auth/dat-lai-mat-khau', { email: updatedEmailB, token: reset2, matKhauMoi: `${password}-reset` }));
  await check('Reset link cannot be reused', 400, () => call('post', '/api/auth/dat-lai-mat-khau', { email: updatedEmailB, token: reset2, matKhauMoi: `${password}-reset2` }));
  await check('New password can login', 200, () => call('post', '/api/auth/dang-nhap', { email: updatedEmailB, matKhau: `${password}-reset` }));
  await call('post', '/api/auth/quen-mat-khau', { email: updatedEmailB });
  const reset3 = new URL(capturedMail.findLast(m => m.link).link).searchParams.get('token');
  await prisma.nguoiDung.update({ where: { id: accountB.id }, data: { resetPasswordExpiry: new Date(Date.now() - 1000) } });
  await check('Expired reset link rejected', 400, () => call('post', '/api/auth/dat-lai-mat-khau', { email: updatedEmailB, token: reset3, matKhauMoi: password }));
  await call('post', '/api/auth/quen-mat-khau', { email: updatedEmailB });
  const reset4 = new URL(capturedMail.findLast(m => m.link).link).searchParams.get('token');
  await check('Concurrent reset consumes link once', 'one success', async () => {
    const responses = await Promise.all([1, 2].map(n => call('post', '/api/auth/dat-lai-mat-khau', { email: updatedEmailB, token: reset4, matKhauMoi: `${password}-race${n}` })));
    return { successes: responses.filter(r => r.status === 200).length, statuses: responses.map(r => r.status) };
  }, r => r.successes === 1);

  // Fresh JWT from DB for deletion and persistence checks after account-reset tests.
  const freshUser = await prisma.nguoiDung.findUnique({ where: { id: accountA.id } });
  tokenA = jwt.sign({ id: freshUser.id, matKhauDoiLuc: freshUser.matKhauDoiLuc.getTime() }, process.env.JWT_SECRET);
  await check('Delete grade', 200, () => call('delete', `/api/academic/diem/${grade2.id}`, undefined, tokenA));
  await check('Delete deadline', 200, () => call('delete', `/api/deadline/${task.id}`, undefined, tokenA));
  await check('Delete timetable class', 200, () => call('delete', `/api/thoi-khoa-bieu/${lesson.id}`, undefined, tokenA));
  await check('Delete expense', 200, () => call('delete', `/api/finance/giao-dich/${transaction.id}`, undefined, tokenA));
  await check('Delete subject', 200, () => call('delete', `/api/academic/mon-hoc/${subject.id}`, undefined, tokenA));
  await check('Deleted subject stays absent', true, async () => (await prisma.monHoc.findUnique({ where: { id: subject.id } })) === null, x => x === true);
}
main().catch(error => { results.push({ name: 'Audit execution', pass: false, actual: error.name }); originalError(error.message); }).finally(async () => {
  if (userIds.length) await prisma.nguoiDung.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
  console.error = originalError;
  const report = { at: new Date().toISOString(), baseline: process.env.SLH_AUDIT_BASELINE === 'true' ? 'a21746f67e4c953b65eaed98297393283b3c868a (snapshot)' : 'working tree at audit time', environment: 'isolated PostgreSQL 18 on loopback:55439', mail: 'captured in-process; no mail sent', ai: 'not configured; no external AI request', total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, loggedServerErrors: loggedErrors, results };
  fs.writeFileSync(path.resolve(__dirname, '../../improvement-backups/functional-audit-20261020/api-results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ total: report.total, passed: report.passed, failed: report.failed, loggedServerErrors: loggedErrors }));
  process.exitCode = results.some(r => !r.pass) ? 1 : 0;
});
