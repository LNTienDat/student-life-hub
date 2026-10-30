const request = require('supertest'), jwt = require('jsonwebtoken'), bcrypt = require('bcryptjs'), { randomUUID } = require('crypto');
const app = require('../../app'), prisma = require('../../src/prismaClient');
let a, b; const ids = [], password = 'Semester-test-only-2026';
const call = (who, method, path, body) => {
  const req = request(app)[method]('/api' + path).set('Authorization', 'Bearer ' + who.token);
  return body ? req.send(body) : req;
};
beforeAll(async () => {
  const db = new URL(process.env.DATABASE_URL);
  if (!['localhost', '127.0.0.1'].includes(db.hostname) || !db.pathname.endsWith('_test')) throw Error('Isolated test database required');
  const account = async () => {
    const u = await prisma.nguoiDung.create({ data: { ten: 'Semester test', email: randomUUID() + '@example.invalid', matKhau: await bcrypt.hash(password, 10) } }); ids.push(u.id);
    return { ...u, token: jwt.sign({ id: u.id, matKhauDoiLuc: u.matKhauDoiLuc.getTime() }, process.env.JWT_SECRET, { expiresIn: '10m' }) };
  }; a = await account(); b = await account();
});
afterAll(async () => { if (ids.length) await prisma.nguoiDung.deleteMany({ where: { id: { in: ids } } }); await prisma.$disconnect(); });
test('current semester defaults empty, saves trimmed to account and survives fresh login', async () => {
  expect((await call(a, 'get', '/auth/ho-so')).body.user.hocKyHienTai).toBe('');
  const saved = await call(a, 'put', '/auth/ho-so', { hocKyHienTai: ' HK1 2026–2027 ' });
  expect(saved.status).toBe(200); expect(saved.body.user.hocKyHienTai).toBe('HK1 2026-2027');
  const login = await request(app).post('/api/auth/dang-nhap').send({ email: a.email, matKhau: password });
  expect(login.status).toBe(200); expect(login.body.user.hocKyHienTai).toBe('HK1 2026-2027'); expect(login.body.user.matKhau).toBeUndefined();
});
test('semester preference belongs to authenticated account even with another account id in body', async () => {
  expect((await call(a, 'put', '/auth/ho-so', { id: b.id, hocKyHienTai: 'HK1 2026–2027' })).status).toBe(200);
  expect((await call(b, 'get', '/auth/ho-so')).body.user.hocKyHienTai).toBe('');
});
test.each(['', '  ', null, {}, 'x'.repeat(101)])('invalid semester is rejected without changing saved preference: %p', async value => {
  const response = await call(a, 'put', '/auth/ho-so', { hocKyHienTai: value });
  expect(response.status).toBe(400); expect((await call(a, 'get', '/auth/ho-so')).body.user.hocKyHienTai).toBe('HK1 2026-2027');
});
test('switching current semester preserves old courses and timetable and their historical filters', async () => {
  expect((await call(a, 'post', '/academic/mon-hoc', { ten: 'Old course', tinChi: 3, hocKy: 'HK1 2026–2027' })).status).toBe(201);
  expect((await call(a, 'post', '/thoi-khoa-bieu', { tenMon: 'Old class', thu: 2, gioBatDau: '07:00', gioKetThuc: '09:00', hocKy: 'HK1 2026–2027' })).status).toBe(201);
  expect((await call(a, 'put', '/auth/ho-so', { hocKyHienTai: 'HK2 2026–2027' })).status).toBe(200);
  expect((await call(a, 'get', '/academic/mon-hoc?hocKy=' + encodeURIComponent('HK1 2026–2027'))).body.monHocs).toHaveLength(1);
  expect((await call(a, 'get', '/thoi-khoa-bieu?hocKy=' + encodeURIComponent('HK1 2026–2027'))).body.thoiKhoaBieu).toHaveLength(1);
  expect((await call(a, 'get', '/thoi-khoa-bieu?hocKy=' + encodeURIComponent('HK2 2026–2027'))).body.thoiKhoaBieu).toHaveLength(0);
});
test('editing a different profile field does not reset current semester', async () => {
  const response = await call(a, 'put', '/auth/ho-so', { ten: 'Updated display name' });
  expect(response.body.user.hocKyHienTai).toBe('HK2 2026-2027'); expect(response.body.user.ten).toBe('Updated display name');
});

test('empty semesters survive switching, login and deletion without crossing accounts', async()=>{
 const first=await call(b,'put','/auth/ho-so',{hocKyHienTai:'HISTORY HK1'});
 expect(first.status).toBe(200);
 const second=await call(b,'put','/auth/ho-so',{hocKyHienTai:'HISTORY HK2'});
 expect(second.body.user.hocKyDaLuu).toEqual(expect.arrayContaining(['HISTORY HK1','HISTORY HK2']));
 const login=await request(app).post('/api/auth/dang-nhap').send({email:b.email,matKhau:password});
 expect(login.body.user.hocKyDaLuu).toContain('HISTORY HK1');
 expect((await call(a,'get','/auth/ho-so')).body.user.hocKyDaLuu).not.toContain('HISTORY HK1');
 const preview=await call(b,'get','/hoc-ky/kiem-tra-xoa?ten=HISTORY%20HK1');
 expect(preview.status).toBe(200);expect(preview.body.soMon).toBe(0);
 const deleted=await call(b,'delete','/hoc-ky',{ten:'HISTORY HK1',xacNhan:'HISTORY HK1',snapshot:preview.body.snapshot});
 expect(deleted.status).toBe(200);expect(deleted.body.hocKyDaLuu).toEqual(['HISTORY HK2']);
 expect((await call(b,'get','/auth/ho-so')).body.user.hocKyDaLuu).toEqual(['HISTORY HK2']);
});
test('concurrent semester changes retain both choices',async()=>{
 const updates=await Promise.all(['CONCURRENT 1','CONCURRENT 2'].map(hocKyHienTai=>call(b,'put','/auth/ho-so',{hocKyHienTai})));
 expect(updates.every(r=>r.status===200)).toBe(true);
 const profile=(await call(b,'get','/auth/ho-so')).body.user;
 expect(profile.hocKyDaLuu).toEqual(expect.arrayContaining(['CONCURRENT 1','CONCURRENT 2']));
});
