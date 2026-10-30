const request = require('supertest'), jwt = require('jsonwebtoken'), { randomUUID } = require('crypto');
const app = require('../../app'), prisma = require('../../src/prismaClient');
const { vietnamParts, monthRange } = require('../../src/utils/date.util');
const ids = []; let user;
const call = (method, path, body) => {
  const req = request(app)[method]('/api' + path).set('Authorization', 'Bearer ' + user.token);
  return body ? req.send(body) : req;
};
beforeAll(async () => {
  const db = new URL(process.env.DATABASE_URL);
  if (!['127.0.0.1', 'localhost'].includes(db.hostname) || !/test|audit/.test(db.pathname)) throw new Error('Isolated test database required');
  user = await prisma.nguoiDung.create({ data: { ten: 'Optimization test', email: randomUUID() + '@example.invalid', matKhau: 'test-only-placeholder' } }); ids.push(user.id);
  user.token = jwt.sign({ id: user.id, matKhauDoiLuc: user.matKhauDoiLuc.getTime() }, process.env.JWT_SECRET, { expiresIn: '10m' });
});
afterAll(async () => { if (ids.length) await prisma.nguoiDung.deleteMany({ where: { id: { in: ids } } }); await prisma.$disconnect(); });
test('private API responses are not cacheable, including validation errors', async () => {
  for (const route of ['/academic/mon-hoc', '/deadline', '/finance/giao-dich', '/thoi-khoa-bieu', '/thong-bao', '/finance/giao-dich?loai=invalid']) {
    expect((await call('get', route)).headers['cache-control']).toBe('no-store');
  }
});
test.each(['/finance/giao-dich?q=a&q=b', '/finance/giao-dich?loai=invalid', '/finance/giao-dich?danhMuc=invalid', '/finance/giao-dich?trang=999999999999999999999'])('malformed filters return 400 instead of a database error: %s', async path => {
  expect((await call('get', path)).status).toBe(400);
});
test('invalid IDs and non-text descriptions are rejected before writes', async () => {
  expect((await call('put', '/finance/giao-dich/2147483648', { soTien: 1 })).status).toBe(400);
  expect((await call('post', '/finance/giao-dich', { loai: 'chi', danhMuc: 'an_uong', soTien: 1, moTa: { invalid: true } })).status).toBe(400);
});
test('waiting deadlines appear in notifications; same-named subjects have distinct stable IDs', async () => {
  const deadline = await prisma.deadline.create({ data: { idNguoiDung: user.id, tieuDe: 'Waiting task', trangThai: 'cho_xu_ly', hanChot: new Date(Date.now() + 3600000) } });
  for (const hocKy of ['HK1', 'HK2']) await prisma.monHoc.create({ data: { idNguoiDung: user.id, ten: 'Same name', tinChi: 3, hocKy, diems: { create: { loaiDanhGia: 'Exam', diem: 4, trongSo: 100 } } } });
  const before = await call('get', '/thong-bao');
  expect(before.body.thongBaos.some(n => n.id.startsWith('deadline-' + deadline.id + '-'))).toBe(true);
  const grades = before.body.thongBaos.filter(n => n.loai === 'hoc_tap');
  expect(grades).toHaveLength(2); expect(new Set(grades.map(n => n.id)).size).toBe(2);
  const previousID = before.body.thongBaos.find(n => n.loai === 'deadline').id;
  await prisma.deadline.update({ where: { id: deadline.id }, data: { hanChot: new Date(Date.now() + 7200000) } });
  expect((await call('get', '/thong-bao')).body.thongBaos.find(n => n.loai === 'deadline').id).not.toBe(previousID);
});
test('grouped summaries retain precise category totals and Vietnamese budget names', async () => {
  const vn = vietnamParts(), { from } = monthRange(vn.month, vn.year);
  await prisma.giaoDich.createMany({ data: [
    { idNguoiDung: user.id, loai: 'thu', danhMuc: 'luong', soTien: 100001, ngayGiaoDich: from },
    { idNguoiDung: user.id, loai: 'chi', danhMuc: 'an_uong', soTien: 20000, ngayGiaoDich: from },
    { idNguoiDung: user.id, loai: 'chi', danhMuc: 'an_uong', soTien: 1000, ngayGiaoDich: from },
  ] });
  await prisma.nganSach.create({ data: { idNguoiDung: user.id, danhMuc: 'an_uong', soTienToiDa: 10000, thang: vn.month, nam: vn.year } });
  expect((await call('get', '/finance/thong-ke')).body).toMatchObject({ tongThu: 100001, tongChi: 21000, soDu: 79001, theoDanhMuc: { an_uong: 21000 } });
  const notification = (await call('get', '/thong-bao')).body.thongBaos.find(n => n.loai === 'ngan_sach');
  expect(notification.tieuDe).toContain('Ăn uống');
  expect(notification.moTa).toContain('21.000');
});
