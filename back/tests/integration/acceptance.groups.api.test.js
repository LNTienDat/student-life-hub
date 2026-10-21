const request = require('supertest');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const app = require('../../app');
const prisma = require('../../src/prismaClient');
const ids = [];
let owner, member, outsider;
const call = (who, method, route, body) => {
  let req = request(app)[method](route).set('Authorization', `Bearer ${who.token}`);
  return body === undefined ? req : req.send(body);
};
async function account() {
  const user = await prisma.nguoiDung.create({ data: { ten: 'Disposable acceptance account', email: `acceptance-${randomUUID()}@example.invalid`, matKhau: 'test-only-placeholder' } });
  ids.push(user.id);
  return { ...user, token: jwt.sign({ id: user.id, matKhauDoiLuc: user.matKhauDoiLuc.getTime() }, process.env.JWT_SECRET, { expiresIn: '10m' }) };
}
async function group() {
  const result = await call(owner, 'post', '/api/nhom/tao', { ten: 'Acceptance group' });
  expect(result.status).toBe(201);
  return result.body.nhom;
}
async function join(who, value) {
  expect((await call(who, 'post', '/api/nhom/tham-gia', { maCode: value.maCode })).status).toBe(200);
}
beforeAll(async () => {
  const db = new URL(process.env.DATABASE_URL);
  if (!['127.0.0.1', 'localhost', 'postgres'].includes(db.hostname) || !/test|audit|bugfix/.test(db.pathname)) throw new Error('An isolated test database is required');
  owner = await account(); member = await account(); outsider = await account();
});
afterAll(async () => {
  if (ids.length) await prisma.nguoiDung.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test('group lists and editing preserve membership and owner permissions', async () => {
  const value = await group();
  expect((await call(outsider, 'get', `/api/nhom/${value.id}`)).status).toBe(403);
  expect((await call(outsider, 'get', '/api/nhom')).body.nhoms.some(n => n.id === value.id)).toBe(false);
  await join(member, value);
  expect((await call(member, 'get', '/api/nhom')).body.nhoms.some(n => n.id === value.id)).toBe(true);
  expect((await call(member, 'put', `/api/nhom/${value.id}`, { ten: 'Forbidden' })).status).toBe(403);
  expect((await call(owner, 'put', `/api/nhom/${value.id}`, { ten: 'Updated group', moTa: 'Updated description' })).status).toBe(200);
  expect((await call(member, 'get', `/api/nhom/${value.id}`)).body.nhom.ten).toBe('Updated group');
  expect((await call(owner, 'put', `/api/nhom/${value.id}`, { ten: ' ' })).status).toBe(400);
});

test('leaving and removal revoke access without allowing a member to remove the owner', async () => {
  const value = await group();
  await join(member, value);
  expect((await call(owner, 'delete', `/api/nhom/${value.id}/roi`)).status).toBe(400);
  expect((await call(member, 'delete', `/api/nhom/${value.id}/kick/${owner.id}`)).status).toBe(403);
  expect((await call(member, 'delete', `/api/nhom/${value.id}/roi`)).status).toBe(200);
  expect((await call(member, 'get', `/api/nhom/${value.id}`)).status).toBe(403);
  await join(member, value);
  expect((await call(owner, 'delete', `/api/nhom/${value.id}/kick/${member.id}`)).status).toBe(200);
  expect((await call(member, 'get', `/api/nhom/${value.id}`)).status).toBe(403);
  expect((await call(owner, 'get', `/api/nhom/${value.id}`)).status).toBe(200);
});

test('deadline editing/deletion and group dissolution respect permissions and remove dependent records', async () => {
  const value = await group();
  await join(member, value);
  const payload = { tieuDe: 'Acceptance task', hanChot: new Date(Date.now() + 86400000).toISOString() };
  const created = await call(owner, 'post', `/api/nhom/${value.id}/deadline`, payload);
  expect(created.status).toBe(201);
  const route = `/api/nhom/${value.id}/deadline/${created.body.deadline.id}`;
  expect((await call(member, 'put', route, { tieuDe: 'Forbidden' })).status).toBe(403);
  expect((await call(member, 'delete', route)).status).toBe(403);
  expect((await call(owner, 'put', route, { tieuDe: 'Updated task', doUuTien: 'cao' })).body.deadline.tieuDe).toBe('Updated task');
  expect((await call(owner, 'delete', route)).status).toBe(200);
  expect(await prisma.tienDoDeadlineNhom.count({ where: { idDeadlineNhom: created.body.deadline.id } })).toBe(0);
  const replacement = await call(member, 'post', `/api/nhom/${value.id}/deadline`, payload);
  expect(replacement.status).toBe(201);
  expect((await call(member, 'delete', `/api/nhom/${value.id}`)).status).toBe(403);
  expect((await call(owner, 'delete', `/api/nhom/${value.id}`)).status).toBe(200);
  expect(await prisma.nhomHocTap.findUnique({ where: { id: value.id } })).toBeNull();
  expect(await prisma.thanhVienNhom.count({ where: { idNhom: value.id } })).toBe(0);
  expect(await prisma.deadlineNhom.count({ where: { idNhom: value.id } })).toBe(0);
  expect(await prisma.tienDoDeadlineNhom.count({ where: { idDeadlineNhom: replacement.body.deadline.id } })).toBe(0);
});
