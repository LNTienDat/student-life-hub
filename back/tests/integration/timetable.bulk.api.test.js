
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const app = require('../../app');
const prisma = require('../../src/prismaClient');
let a, b;
const userIds = [];
const call = (user, ids) => request(app).post('/api/thoi-khoa-bieu/xoa-nhieu')
  .set('Authorization', 'Bearer ' + user.token).send({ ids });
async function lesson(user, hocKy = 'HK1', title = 'Buổi thử') {
  return prisma.thoiKhoaBieu.create({ data: { idNguoiDung: user.id, tenMon: title, hocKy, thu: 2, gioBatDau: '07:00', gioKetThuc: '09:00' } });
}
beforeAll(async () => {
  const db = new URL(process.env.DATABASE_URL);
  if (!['localhost', '127.0.0.1'].includes(db.hostname) || !db.pathname.endsWith('_test')) throw Error('Isolated test database required');
  const make = async () => {
    const user = await prisma.nguoiDung.create({ data: { ten: 'Timetable cleanup test', email: randomUUID() + '@example.invalid', matKhau: 'test-only' } });
    userIds.push(user.id);
    return { ...user, token: jwt.sign({ id: user.id, matKhauDoiLuc: user.matKhauDoiLuc.getTime() }, process.env.JWT_SECRET, { expiresIn: '10m' }) };
  };
  a = await make(); b = await make();
});
afterAll(async () => { if (userIds.length) await prisma.nguoiDung.deleteMany({ where: { id: { in: userIds } } }); await prisma.$disconnect(); });

test('bulk delete requires authentication', async () => {
  expect((await request(app).post('/api/thoi-khoa-bieu/xoa-nhieu').send({ ids: [1] })).status).toBe(401);
});
test.each([null, [], ['1'], [1, 1], [0], [-1], [1.5], [2147483648], Array.from({ length: 1001 }, (_, i) => i + 1)])('reject unsafe or ambiguous selection %p', async ids => {
  expect((await call(a, ids)).status).toBe(400);
});
test('a mixed own/foreign selection fails atomically and supplied user id is ignored', async () => {
  const own = await lesson(a), foreign = await lesson(b);
  const response = await request(app).post('/api/thoi-khoa-bieu/xoa-nhieu').set('Authorization', 'Bearer ' + a.token)
    .send({ ids: [own.id, foreign.id], idNguoiDung: b.id });
  expect(response.status).toBe(409);
  expect(await prisma.thoiKhoaBieu.count({ where: { id: { in: [own.id, foreign.id] } } })).toBe(2);
});
test('delete exactly reviewed ids and preserve another semester, owner and newly added lesson', async () => {
  const first = await lesson(a), shared = await lesson(a, ''), other = await lesson(a, 'HK2');
  const foreign = await lesson(b), added = await lesson(a, 'HK1', 'Added after preview');
  const response = await call(a, [first.id, shared.id]);
  expect(response.status).toBe(200); expect(response.body.count).toBe(2);
  expect(await prisma.thoiKhoaBieu.count({ where: { id: { in: [first.id, shared.id] } } })).toBe(0);
  expect(await prisma.thoiKhoaBieu.count({ where: { id: { in: [other.id, foreign.id, added.id] } } })).toBe(3);
  expect((await call(a, [first.id, shared.id])).status).toBe(409);
});
test('a stale selection cannot partially delete remaining lessons', async () => {
  const removed = await lesson(a), remaining = await lesson(a);
  await prisma.thoiKhoaBieu.delete({ where: { id: removed.id } });
  expect((await call(a, [removed.id, remaining.id])).status).toBe(409);
  expect(await prisma.thoiKhoaBieu.findUnique({ where: { id: remaining.id } })).not.toBeNull();
});
