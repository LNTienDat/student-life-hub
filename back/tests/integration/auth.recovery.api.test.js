jest.mock('../../src/utils/email.util', () => ({ guiEmailDatLaiMatKhau: jest.fn() }));
const request = require('supertest');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const prisma = require('../../src/prismaClient');
const { guiEmailDatLaiMatKhau: mail } = require('../../src/utils/email.util');
const { gioiHanDangNhap } = require('../../src/middlewares/rateLimit.middleware');
const originalFrontend = process.env.FRONTEND_URL;
const password = 'Recovery-before-2026', newPassword = 'Recovery-after-2026';
const ids = [];
let user, oldSession;
const post = (route, body) => request(app).post('/api/auth/' + route).send(body);
const forgot = () => post('quen-mat-khau', { email: user.email.toUpperCase() });
const rawLink = index => new URL(mail.mock.calls[index || 0][2]).searchParams.get('token');
const reset = (token, matKhauMoi = newPassword, email = user.email) => post('dat-lai-mat-khau', { email, token, matKhauMoi });
const saved = () => prisma.nguoiDung.findUnique({ where: { id: user.id } });
beforeAll(() => {
  const db = new URL(process.env.DATABASE_URL);
  if (!['127.0.0.1','localhost'].includes(db.hostname) || !db.pathname.endsWith('_test')) throw Error('Isolated test database required');
  process.env.FRONTEND_URL = 'http://127.0.0.1:5173';
});
beforeEach(async () => {
  for (const ip of ['127.0.0.1','::ffff:127.0.0.1','::1']) gioiHanDangNhap.resetKey(ip);
  mail.mockReset(); mail.mockResolvedValue(undefined);
  user = await prisma.nguoiDung.create({ data: { ten: 'Recovery test', email: crypto.randomUUID() + '@example.invalid', matKhau: await bcrypt.hash(password, 4) } });
  ids.push(user.id);
  oldSession = jwt.sign({ id:user.id, matKhauDoiLuc:user.matKhauDoiLuc.getTime() }, process.env.JWT_SECRET);
});
afterAll(async () => {
  if (ids.length) await prisma.nguoiDung.deleteMany({where:{id:{in:ids}}});
  await prisma.$disconnect();
  if (originalFrontend === undefined) delete process.env.FRONTEND_URL; else process.env.FRONTEND_URL = originalFrontend;
});

test('forgot-password stores only a hash, normalized recipient, limited expiry and generic response', async () => {
  const before = Date.now(), response = await forgot(), row = await saved();
  expect(response.status).toBe(200); expect(mail).toHaveBeenCalledTimes(1);
  expect(mail.mock.calls[0][0]).toBe(user.email);
  const link = new URL(mail.mock.calls[0][2]), raw = link.searchParams.get('token');
  expect(link.origin).toBe(process.env.FRONTEND_URL); expect(link.pathname).toBe('/dat-lai-mat-khau');
  expect(link.searchParams.get('email')).toBe(user.email);
  expect(raw).toMatch(/^[a-f0-9]{64}$/);
  expect(row.resetPasswordToken).toBe(crypto.createHash('sha256').update(raw).digest('hex'));
  expect(row.resetPasswordToken).not.toBe(raw);
  expect(row.resetPasswordExpiry.getTime()).toBeGreaterThan(before + 14*60000);
  expect(row.resetPasswordExpiry.getTime()).toBeLessThanOrEqual(Date.now() + 15*60000);
  const missing = await post('quen-mat-khau',{email:crypto.randomUUID()+'@example.invalid'});
  expect(missing.body).toEqual(response.body); expect(mail).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(response.body)).not.toContain(raw);
});
test('mail failure clears its reset link and preserves password/session', async () => {
  mail.mockRejectedValueOnce(new Error('private-mail-credential'));
  const response = await forgot(), row = await saved();
  expect(response.status).toBe(503); expect(JSON.stringify(response.body)).not.toContain('private-mail-credential');
  expect(row.resetPasswordToken).toBeNull(); expect(row.resetPasswordExpiry).toBeNull(); expect(row.matKhau).toBe(user.matKhau);
  expect((await reset(rawLink())).status).toBe(400);
  expect((await request(app).get('/api/auth/ho-so').set('Authorization','Bearer '+oldSession)).status).toBe(200);
});
test('a delayed failed email cannot revoke the newer successful reset link', async () => {
  let rejectFirst, signalStarted;
  const started = new Promise(resolve => { signalStarted=resolve; });
  mail.mockImplementationOnce(() => { signalStarted(); return new Promise((resolve,reject) => { rejectFirst=reject; }); });
  const first = forgot().then(r => r);
  await started;
  const second = await forgot(); expect(second.status).toBe(200);
  const newer = rawLink(1);
  rejectFirst(new Error('simulated delayed SMTP failure'));
  expect((await first).status).toBe(503);
  expect((await saved()).resetPasswordToken).toBe(crypto.createHash('sha256').update(newer).digest('hex'));
  expect((await reset(newer)).status).toBe(200);
});
test('requesting a newer link invalidates the older one without changing the password', async () => {
  await forgot(); const older = rawLink();
  await forgot(); const newer = rawLink(1);
  expect(newer).not.toBe(older); expect((await reset(older)).status).toBe(400);
  expect((await saved()).matKhau).toBe(user.matKhau);
  expect((await reset(newer)).status).toBe(200);
});
test('wrong, cross-account and expired links cannot change credentials', async () => {
  await forgot(); const raw = rawLink(), before = await saved();
  expect((await reset('0'.repeat(64))).status).toBe(400);
  expect((await reset(raw,newPassword,crypto.randomUUID()+'@example.invalid')).status).toBe(400);
  await prisma.nguoiDung.update({where:{id:user.id},data:{resetPasswordExpiry:new Date(Date.now()-1000)}});
  expect((await reset(raw)).status).toBe(400);
  const after=await saved(); expect(after.matKhau).toBe(before.matKhau); expect(after.matKhauDoiLuc).toEqual(before.matKhauDoiLuc);
});
test('reset consumes its link once, revokes old sessions and permits only the new password', async () => {
  await forgot(); const raw = rawLink();
  expect((await reset(raw)).status).toBe(200);
  const row=await saved(); expect(row.resetPasswordToken).toBeNull(); expect(row.resetPasswordExpiry).toBeNull();
  expect(row.matKhauDoiLuc.getTime()).toBeGreaterThan(user.matKhauDoiLuc.getTime());
  expect((await request(app).get('/api/auth/ho-so').set('Authorization','Bearer '+oldSession)).status).toBe(403);
  const oldLogin=await post('dang-nhap',{email:user.email,matKhau:password}); expect(oldLogin.status).toBe(400); expect(oldLogin.body).not.toHaveProperty('token');
  const login=await post('dang-nhap',{email:user.email,matKhau:newPassword}); expect(login.status).toBe(200);
  expect((await request(app).get('/api/auth/ho-so').set('Authorization','Bearer '+login.body.token)).status).toBe(200);
  expect((await reset(raw)).status).toBe(400);
});
test('invalid inputs keep a usable reset link intact', async () => {
  await forgot(); const raw=rawLink(), before=await saved();
  for(const next of ['abc','a'.repeat(73),'ậ'.repeat(25)]) expect((await reset(raw,next)).status).toBe(400);
  expect((await reset('invalid-token')).status).toBe(400);
  const after=await saved(); expect(after.matKhau).toBe(before.matKhau); expect(after.resetPasswordToken).toBe(before.resetPasswordToken);
  expect((await reset(raw)).status).toBe(200);
});
