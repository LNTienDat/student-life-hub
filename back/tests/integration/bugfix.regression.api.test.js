const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const app = require('../../app');
const prisma = require('../../src/prismaClient');
const { randomUUID } = require('crypto');
const ids = [];
const password = 'Regression-test-only-2026';
let owner, other, member;
const call = (method, route, body, user = owner) => {
  let result = request(app)[method](route);
  if (user) result = result.set('Authorization', `Bearer ${user.token}`);
  if (body !== undefined) result = result.send(body);
  return result;
};
async function user(name) {
  const result = await prisma.nguoiDung.create({ data: { ten: name, email: `fix-${randomUUID()}@example.invalid`, matKhau: await bcrypt.hash(password, 4) } });
  ids.push(result.id);
  return { ...result, token: jwt.sign({ id: result.id, matKhauDoiLuc: result.matKhauDoiLuc.getTime() }, process.env.JWT_SECRET) };
}
async function group(user) {
  return prisma.nhomHocTap.create({ data: { ten: 'Regression group', maCode: randomUUID(), idChuNhom: user.id, thanhViens: { create: { idNguoiDung: user.id, vaiTro: 'chu_nhom' } } } });
}
async function resetToken(user) {
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.nguoiDung.update({ where: { id: user.id }, data: { resetPasswordToken: crypto.createHash('sha256').update(token).digest('hex'), resetPasswordExpiry: new Date(Date.now() + 60000) } });
  return token;
}
beforeAll(async () => {
  const db = new URL(process.env.DATABASE_URL);
  if (!['localhost', '127.0.0.1', 'postgres'].includes(db.hostname) || !/test|review|audit|bugfix/.test(db.pathname)) throw new Error('Isolated database required');
  owner = await user('Owner'); other = await user('Other'); member = await user('Member');
});
afterAll(async () => { if (ids.length) await prisma.nguoiDung.deleteMany({ where: { id: { in: ids } } }); await prisma.$disconnect(); });

test('empty GPA is distinguishable from a real zero score', async () => {
  const result = await call('get', '/api/academic/gpa');
  expect(result.body.hasGrades).toBe(false);
});
test('concurrent grade writes cannot exceed 100% total weight', async () => {
  const mon = await prisma.monHoc.create({ data: { idNguoiDung: owner.id, ten: 'Concurrent grades', tinChi: 3, hocKy: 'QA' } });
  const responses = await Promise.all([1, 2].map(n => call('post', '/api/academic/diem', { idMonHoc: mon.id, loaiDanhGia: `Grade ${n}`, diem: 8, trongSo: 70 })));
  expect(responses.map(r => r.status).sort()).toEqual([201, 400]);
  const saved = await prisma.diem.findMany({ where: { idMonHoc: mon.id } });
  expect(saved.reduce((sum, d) => sum + d.trongSo, 0)).toBe(70);
});
test('concurrent class creation rejects conflicts, while imports stay atomic', async () => {
  const data = { tenMon: 'Concurrent classes', thu: 4, gioBatDau: '07:00', gioKetThuc: '09:00', hocKy: 'Conflict QA' };
  const result = await Promise.all([1, 2].map(() => call('post', '/api/thoi-khoa-bieu', data)));
  expect(result.map(r => r.status).sort()).toEqual([201, 409]);
  const csv = 'tenMon,thu,gioBatDau,gioKetThuc,phongHoc,giangVien,hocKy\nConflict,4,08:00,10:00,A1,QA,Conflict QA';
  const imported = await call('post', '/api/imports/commit', { kind: 'timetable', filename: 'conflict.csv', content: Buffer.from(csv).toString('base64') });
  expect(imported.status).toBe(400);
  expect(await prisma.thoiKhoaBieu.count({ where: { idNguoiDung: owner.id, hocKy: 'Conflict QA' } })).toBe(1);
});
test('group membership and deadline group are both required for progress writes', async () => {
  const a = await group(owner), b = await group(other);
  const task = await prisma.deadlineNhom.create({ data: { idNhom: b.id, idNguoiTao: other.id, tieuDe: 'Private B', hanChot: new Date() } });
  const attack = await call('put', `/api/nhom/${a.id}/deadline/${task.id}/tien-do`, { trangThai: 'hoan_thanh' });
  expect(attack.status).toBe(404);
  expect(await prisma.tienDoDeadlineNhom.count({ where: { idDeadlineNhom: task.id, idNguoiDung: owner.id } })).toBe(0);
});
test('removed creators lose editing/deletion rights and are excluded from progress totals', async () => {
  const a = await group(owner);
  await prisma.thanhVienNhom.create({ data: { idNhom: a.id, idNguoiDung: member.id } });
  const task = (await call('post', `/api/nhom/${a.id}/deadline`, { tieuDe: 'Member task', hanChot: new Date(Date.now() + 100000).toISOString() }, member)).body.deadline;
  await call('put', `/api/nhom/${a.id}/deadline/${task.id}/tien-do`, { trangThai: 'hoan_thanh' }, member);
  await call('put', `/api/nhom/${a.id}/deadline/${task.id}/tien-do`, { trangThai: 'hoan_thanh' });
  expect((await call('delete', `/api/nhom/${a.id}/kick/${member.id}`)).status).toBe(200);
  expect((await call('put', `/api/nhom/${a.id}/deadline/${task.id}`, { tieuDe: 'Unauthorized edit' }, member)).status).toBe(403);
  expect((await call('delete', `/api/nhom/${a.id}/deadline/${task.id}`, undefined, member)).status).toBe(403);
  const detail = (await call('get', `/api/nhom/${a.id}`)).body.nhom;
  expect(detail.thanhViens).toHaveLength(1);
  expect(detail.deadlineNhoms[0].tienDos).toHaveLength(1);
});
test('sharing can be disabled and re-enabling rotates the revoked link', async () => {
  const first = (await call('post', '/api/thoi-khoa-bieu/share/bat', {})).body.shareToken;
  await call('post', '/api/thoi-khoa-bieu/share/tat', {});
  const second = (await call('post', '/api/thoi-khoa-bieu/share/bat', {})).body.shareToken;
  expect(second).not.toBe(first);
  expect((await call('get', `/api/thoi-khoa-bieu/share/public/${first}`, undefined, null)).status).toBe(404);
  expect((await call('get', `/api/thoi-khoa-bieu/share/public/${second}`, undefined, null)).status).toBe(200);
});
test('reset links are normalized, consumed once, and invalidate old sessions', async () => {
  const raw = await resetToken(other);
  const results = await Promise.all([1, 2].map(() => call('post', '/api/auth/dat-lai-mat-khau', { email: other.email.toUpperCase(), token: raw, matKhauMoi: password }, null)));
  expect(results.map(r => r.status).sort()).toEqual([200, 400]);
  expect((await call('get', '/api/auth/ho-so', undefined, other)).status).toBe(403);
});
test('password changes revoke previously issued reset links', async () => {
  const raw = await resetToken(owner);
  expect((await call('put', '/api/auth/doi-mat-khau', { matKhauCu: password, matKhauMoi: password })).status).toBe(200);
  expect((await call('post', '/api/auth/dat-lai-mat-khau', { email: owner.email, token: raw, matKhauMoi: password }, null)).status).toBe(400);
});
