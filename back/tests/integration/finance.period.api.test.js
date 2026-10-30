const request = require('supertest'), jwt = require('jsonwebtoken'), { randomUUID } = require('crypto');
const ExcelJS = require('exceljs');
const app = require('../../app'), prisma = require('../../src/prismaClient');
const ids = [];
let owner, outsider;
const call = (who, method, route, body) => {
  const req = request(app)[method]('/api/finance' + route).set('Authorization', 'Bearer ' + who.token);
  return body ? req.send(body) : req;
};
async function account() {
  const user = await prisma.nguoiDung.create({ data: { ten: 'Finance test', email: 'finance-' + randomUUID() + '@example.invalid', matKhau: 'test-only-placeholder' } });
  ids.push(user.id); return { ...user, token: jwt.sign({ id: user.id, matKhauDoiLuc: user.matKhauDoiLuc.getTime() }, process.env.JWT_SECRET, { expiresIn: '10m' }) };
}
beforeAll(async () => {
  const db = new URL(process.env.DATABASE_URL);
  if (!['127.0.0.1', 'localhost'].includes(db.hostname) || !/test|audit/.test(db.pathname)) throw new Error('Isolated test database required');
  owner = await account(); outsider = await account();
  await prisma.giaoDich.createMany({ data: [
    { idNguoiDung: owner.id, loai: 'thu', danhMuc: 'luong', soTien: 100001, ngayGiaoDich: new Date('2025-12-31T17:00:00Z') },
    { idNguoiDung: owner.id, loai: 'chi', danhMuc: 'an_uong', soTien: 20000, ngayGiaoDich: new Date('2026-01-31T16:59:59Z') },
    { idNguoiDung: owner.id, loai: 'chi', danhMuc: 'an_uong', soTien: 30000, ngayGiaoDich: new Date('2026-01-31T17:00:00Z') },
    { idNguoiDung: outsider.id, loai: 'thu', danhMuc: 'luong', soTien: 999999, ngayGiaoDich: new Date('2026-01-01T01:00:00Z') },
  ] });
});
afterAll(async () => { if (ids.length) await prisma.nguoiDung.deleteMany({ where: { id: { in: ids } } }); await prisma.$disconnect(); });
test('selected month agrees across list, stats, budgets, trend and export at Vietnam midnight', async () => {
  expect((await call(owner, 'post', '/ngan-sach', { danhMuc: 'an_uong', soTienToiDa: 50000, thang: 1, nam: 2026 })).status).toBe(200);
  const [list, stats, budget, trend] = await Promise.all([
    call(owner, 'get', '/giao-dich?thang=1&nam=2026'), call(owner, 'get', '/thong-ke?thang=1&nam=2026'),
    call(owner, 'get', '/ngan-sach?thang=1&nam=2026'), call(owner, 'get', '/xu-huong?soThang=6&thang=1&nam=2026'),
  ]);
  expect(list.body.tongSo).toBe(2); expect(stats.body).toMatchObject({ tongThu: 100001, tongChi: 20000, soDu: 80001 });
  expect(budget.body.ketQua[0].daChi).toBe(20000);
  expect(trend.body.xuHuong).toHaveLength(6);
  expect(trend.body.xuHuong[0].thang).toBe('8/2025');
  expect(trend.body.xuHuong.at(-1)).toMatchObject({ thang: '1/2026', thu: 100001, chi: 20000 });
  const file = await call(owner, 'get', '/xuat-bao-cao?thang=1&nam=2026').buffer(true).parse((res, cb) => { const parts = []; res.on('data', c => parts.push(c)); res.on('end', () => cb(null, Buffer.concat(parts))); });
  const wb = new ExcelJS.Workbook(); await wb.xlsx.load(file.body);
  expect(wb.getWorksheet('Tổng kết').getCell('B2').value).toBe(100001);
  expect(wb.getWorksheet('Tổng kết').getCell('B3').value).toBe(20000);
  expect(wb.getWorksheet('Chi tiết giao dịch').getCell('A2').value).toBe('1/1/2026');
});
test('editing type/date/amount moves totals and budgets between periods without changing ownership', async () => {
  const gd = await prisma.giaoDich.findFirst({ where: { idNguoiDung: owner.id, loai: 'chi', soTien: 20000 } });
  expect((await call(outsider, 'put', '/giao-dich/' + gd.id, { soTien: 40000 })).status).toBe(404);
  expect((await call(owner, 'put', '/giao-dich/' + gd.id, { soTien: 40000, ngayGiaoDich: '2026-02-15', moTa: 'Edited' })).status).toBe(200);
  expect((await call(owner, 'get', '/thong-ke?thang=1&nam=2026')).body.tongChi).toBe(0);
  expect((await call(owner, 'get', '/ngan-sach?thang=1&nam=2026')).body.ketQua[0].daChi).toBe(0);
  expect((await call(owner, 'get', '/thong-ke?thang=2&nam=2026')).body.tongChi).toBe(70000);
  expect((await call(owner, 'put', '/giao-dich/' + gd.id, { loai: 'thu', danhMuc: 'luong', soTien: 50000 })).status).toBe(200);
  expect((await call(owner, 'get', '/thong-ke?thang=2&nam=2026')).body).toMatchObject({ tongThu: 50000, tongChi: 30000, soDu: 20000 });
  expect((await call(owner, 'delete', '/giao-dich/' + gd.id)).status).toBe(200);
  expect((await call(owner, 'get', '/thong-ke?thang=2&nam=2026')).body.tongThu).toBe(0);
});
test('budget updates target only the selected month and account', async () => {
  await call(owner, 'post', '/ngan-sach', { danhMuc: 'an_uong', soTienToiDa: 90000, thang: 2, nam: 2026 });
  expect((await call(owner, 'get', '/ngan-sach?thang=1&nam=2026')).body.ketQua[0].soTienToiDa).toBe(50000);
  expect((await call(owner, 'get', '/ngan-sach?thang=2&nam=2026')).body.ketQua[0].soTienToiDa).toBe(90000);
  expect((await call(outsider, 'get', '/ngan-sach?thang=2&nam=2026')).body.ketQua).toEqual([]);
});
test.each(['/xu-huong?thang=13&nam=2026', '/xu-huong?thang=1', '/xu-huong?nam=2026', '/xu-huong?thang=1&nam=abc'])('invalid or incomplete selected periods are rejected: %s', async route => {
  expect((await call(owner, 'get', route)).status).toBe(400);
});
