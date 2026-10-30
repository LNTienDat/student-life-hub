const request = require('supertest'), jwt = require('jsonwebtoken'), { randomUUID } = require('crypto');
const app = require('../../app'), prisma = require('../../src/prismaClient');
let a, b;
const call = (user, method, path, body) => request(app)[method]('/api/deadline' + path).set('Authorization', 'Bearer ' + user.token).send(body);
const row = (user, data = {}) => prisma.deadline.create({ data: { idNguoiDung: user.id, tieuDe: 'Cleanup test', hanChot: new Date(), ...data } });
beforeAll(async () => {
  const db = new URL(process.env.DATABASE_URL);
  if (!['localhost', '127.0.0.1'].includes(db.hostname) || !db.pathname.endsWith('_test')) throw Error('Isolated DB required');
  const make = async () => { const u = await prisma.nguoiDung.create({ data: { ten: 'Cleanup test', email: randomUUID() + '@example.invalid', matKhau: 'test-only' } });
    return { ...u, token: jwt.sign({ id: u.id, matKhauDoiLuc: u.matKhauDoiLuc.getTime() }, process.env.JWT_SECRET, { expiresIn: '10m' }) }; };
  a = await make(); b = await make();
});
beforeEach(async () => {
  await prisma.deadline.deleteMany({ where: { idNguoiDung: { in: [a.id, b.id] } } });
  await prisma.nguoiDung.updateMany({ where: { id: { in: [a.id, b.id] } }, data: { tuDongXoaDeadline: false } });
});
afterAll(async () => { await prisma.nguoiDung.deleteMany({ where: { id: { in: [a?.id, b?.id].filter(Boolean) } } }); await prisma.$disconnect(); });

test('completion timestamps use server time, survive edits/repeated completion and reset on reopening', async () => {
  const d = await row(a), before = Date.now();
  const completed = await call(a, 'put', '/' + d.id, { trangThai: 'hoan_thanh', hoanThanhLuc: '2000-01-01' });
  expect(completed.status).toBe(200);
  const stamp = completed.body.deadline.hoanThanhLuc;
  expect(Date.parse(stamp)).toBeGreaterThanOrEqual(before);
  expect((await call(a, 'patch', '/' + d.id + '/hoan-thanh')).body.deadline.hoanThanhLuc).toBe(stamp);
  expect((await call(a, 'put', '/' + d.id, { tieuDe: 'Edited' })).body.deadline.hoanThanhLuc).toBe(stamp);
  expect((await call(a, 'put', '/' + d.id, { trangThai: 'cho_xu_ly' })).body.deadline.hoanThanhLuc).toBeNull();
  expect((await call(a, 'patch', '/' + d.id + '/hoan-thanh')).body.deadline.hoanThanhLuc).not.toBeNull();
});
test('cleanup is off by default; enabling moves only expired completed own tasks into trash', async () => {
  const old = new Date(Date.now() - 25 * 3600000), fresh = new Date();
  const expired = await row(a, { trangThai: 'hoan_thanh', hoanThanhLuc: old });
  const recent = await row(a, { trangThai: 'hoan_thanh', hoanThanhLuc: fresh });
  const pending = await row(a, { hoanThanhLuc: old });
  const other = await row(b, { trangThai: 'hoan_thanh', hoanThanhLuc: old });
  let list = await call(a, 'get', '');
  expect(list.body.tuDongXoaDeadline).toBe(false); expect(list.body.deadlines).toHaveLength(3); expect(list.body.daXoa).toEqual([]);
  expect((await call(a, 'put', '/cai-dat', { tuDongXoaDeadline: true })).status).toBe(200);
  list = await call(a, 'get', '');
  expect(list.body.deadlines.map(d => d.id).sort()).toEqual([recent.id, pending.id].sort());
  expect(list.body.daXoa.map(d => d.id)).toEqual([expired.id]);
  expect((await prisma.deadline.findUnique({ where: { id: other.id } })).xoaLuc).toBeNull();
  await call(a, 'put', '/cai-dat', { tuDongXoaDeadline: false });
  expect((await call(a, 'get', '')).body.daXoa).toHaveLength(1);
});
test('read synchronizes expiry while open; restoring requires ownership and starts as pending', async () => {
  const d = await row(a, { trangThai: 'hoan_thanh', hoanThanhLuc: new Date(Date.now() - 86400001) });
  await prisma.nguoiDung.update({ where: { id: a.id }, data: { tuDongXoaDeadline: true } });
  expect((await call(a, 'get', '')).body.daXoa.map(r => r.id)).toContain(d.id);
  expect((await call(b, 'patch', '/' + d.id + '/khoi-phuc')).status).toBe(404);
  expect((await call(a, 'put', '/' + d.id, { trangThai: 'cho_xu_ly' })).status).toBe(404);
  expect((await call(a, 'patch', '/' + d.id + '/khoi-phuc')).status).toBe(200);
  const restored = (await call(a, 'get', '')).body;
  expect(restored.daXoa).toEqual([]); expect(restored.deadlines[0]).toMatchObject({ id: d.id, trangThai: 'cho_xu_ly', hoanThanhLuc: null, xoaLuc: null });
});
test('settings reject coercion and completion cannot touch another account', async () => {
  for (const value of ['true', 1, null]) expect((await call(a, 'put', '/cai-dat', { tuDongXoaDeadline: value })).status).toBe(400);
  const d = await row(a);
  expect((await call(b, 'patch', '/' + d.id + '/hoan-thanh')).status).toBe(404);
  expect((await call(a, 'patch', '/' + d.id + '/khoi-phuc')).status).toBe(404);
});
test('turning off still retains tasks whose enabled 24-hour window already expired', async () => {
  await prisma.nguoiDung.update({ where: { id: a.id }, data: { tuDongXoaDeadline: true } });
  const d = await row(a, { trangThai: 'hoan_thanh', hoanThanhLuc: new Date(Date.now() - 90000000) });
  await call(a, 'put', '/cai-dat', { tuDongXoaDeadline: false });
  expect((await call(a, 'get', '')).body.daXoa.map(r => r.id)).toContain(d.id);
  expect((await call(b, 'delete', '/' + d.id)).status).toBe(404);
  expect((await call(a, 'delete', '/' + d.id)).status).toBe(200);
  expect(await prisma.deadline.findUnique({ where: { id: d.id } })).toBeNull();
});
