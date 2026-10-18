const request = require('supertest');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const app = require('../../app');
const prisma = require('../../src/prismaClient');

const createdIds = [];
async function account() {
  const user = await prisma.nguoiDung.create({ data: { email: `workflow-${randomUUID()}@example.invalid`, ten: 'Disposable API test', matKhau: randomUUID() } });
  createdIds.push(user.id);
  return { id: user.id, token: jwt.sign({ id: user.id, matKhauDoiLuc: user.matKhauDoiLuc.getTime() }, process.env.JWT_SECRET, { expiresIn: '5m' }) };
}
afterAll(async () => {
  // Only remove the exact temporary accounts created by this suite.
  if (createdIds.length) await prisma.nguoiDung.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.$disconnect();
});
test('authenticated import, semester filtering and checklist updates work through HTTP APIs', async () => {
  const owner = await account();
  const other = await account();
  const auth = { Authorization: `Bearer ${owner.token}` };
  const upload = { kind: 'subjects', filename: 'subjects.csv', content: Buffer.from('ten,tinChi,hocKy\nDatabase,3,HK1').toString('base64') };
  expect((await request(app).post('/api/imports/commit').send(upload)).status).toBe(401);
  const preview = await request(app).post('/api/imports/preview').set(auth).send(upload);
  expect(preview.status).toBe(200);
  expect(preview.body.rows[0].errors).toEqual([]);
  expect((await prisma.monHoc.count({ where: { idNguoiDung: owner.id } }))).toBe(0);
  const commit = await request(app).post('/api/imports/commit').set(auth).send(upload);
  expect(commit.body).toEqual({ count: 1, skipped: 0 });
  expect((await request(app).post('/api/imports/commit').set(auth).send(upload)).body).toEqual({ count: 0, skipped: 1 });
  expect((await request(app).get('/api/academic/mon-hoc?hocKy=HK2').set(auth)).body.monHocs).toEqual([]);
  expect((await request(app).get('/api/academic/mon-hoc?hocKy=HK1').set(auth)).body.monHocs).toHaveLength(1);
  const checklist = [{ id: 'step-1', title: 'Research', done: false }];
  const task = await request(app).post('/api/deadline').set(auth).send({ tieuDe: 'Test deadline', hanChot: new Date(Date.now() + 86400000).toISOString(), checklist });
  expect(task.status).toBe(201);
  const id = task.body.deadline.id;
  expect((await request(app).put(`/api/deadline/${id}`).set({ Authorization: `Bearer ${other.token}` }).send({ checklist: [] })).status).toBe(404);
  const updated = await request(app).put(`/api/deadline/${id}`).set(auth).send({ checklist: [{ ...checklist[0], done: true }] });
  expect(updated.body.deadline.checklist[0].done).toBe(true);
  const done = await request(app).patch(`/api/deadline/${id}/hoan-thanh`).set(auth);
  expect(done.body.deadline.trangThai).toBe('hoan_thanh');
  const bad = { ...upload, content: Buffer.from('ten,tinChi,hocKy\nValid,3,HK1\nInvalid,0,HK1').toString('base64') };
  expect((await request(app).post('/api/imports/commit').set(auth).send(bad)).status).toBe(400);
  expect(await prisma.monHoc.count({ where: { idNguoiDung: owner.id } })).toBe(1);
}, 20000);
