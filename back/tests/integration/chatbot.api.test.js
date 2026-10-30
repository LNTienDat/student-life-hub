const request = require('supertest');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const app = require('../../app');
const prisma = require('../../src/prismaClient');
const { monthRange, vietnamParts } = require('../../src/utils/date.util');
const ids = [];
let a, b;
const originalFetch = global.fetch;
const oldEnv = { ...process.env };
const ask = (who, body) => request(app).post('/api/chatbot/hoi-dap').set('Authorization', 'Bearer ' + who.token).send(body);
async function account() {
  const user = await prisma.nguoiDung.create({ data: { ten: 'Chatbot test', email: 'chatbot-' + randomUUID() + '@example.invalid', matKhau: 'test-only-placeholder' } });
  ids.push(user.id);
  return { ...user, token: jwt.sign({ id: user.id, matKhauDoiLuc: user.matKhauDoiLuc.getTime() }, process.env.JWT_SECRET, { expiresIn: '10m' }) };
}
beforeAll(async () => {
  const db = new URL(process.env.DATABASE_URL);
  if (!['127.0.0.1', 'localhost'].includes(db.hostname) || !/test|audit/.test(db.pathname)) throw new Error('Isolated test database required');
  a = await account(); b = await account();
  const vn = vietnamParts(), { from, to } = monthRange(vn.month, vn.year);
  await prisma.giaoDich.createMany({ data: [
    { idNguoiDung: a.id, loai: 'thu', danhMuc: 'luong', soTien: 100001, ngayGiaoDich: from, moTa: 'Private raw note' },
    { idNguoiDung: a.id, loai: 'chi', danhMuc: 'an_uong', soTien: 20000, ngayGiaoDich: from },
    { idNguoiDung: a.id, loai: 'thu', danhMuc: 'luong', soTien: 777777, ngayGiaoDich: to },
    { idNguoiDung: b.id, loai: 'thu', danhMuc: 'luong', soTien: 999999, ngayGiaoDich: from },
  ] });
  await prisma.deadline.createMany({ data: [
    { idNguoiDung: a.id, tieuDe: 'My overdue', hanChot: new Date(Date.now() - 86400000) },
    { idNguoiDung: b.id, tieuDe: 'Other account secret', hanChot: new Date(Date.now() - 86400000) },
  ] });
});
beforeEach(() => {
  global.fetch = jest.fn(() => { throw new Error('No external API calls allowed'); });
  process.env.CHATBOT_AI_ENABLED = 'false';
});
afterAll(async () => {
  global.fetch = originalFetch; process.env = { ...oldEnv };
  if (ids.length) await prisma.nguoiDung.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});
test('status and chat require authentication', async () => {
  expect((await request(app).get('/api/chatbot/trang-thai')).status).toBe(401);
  expect((await request(app).post('/api/chatbot/hoi-dap').send({ tinNhan: 'GPA' })).status).toBe(401);
});
test('exact current-month totals exclude next-month and other-user transactions', async () => {
  const res = await ask(a, { tinNhan: 'Tháng này chi bao nhiêu?', idNguoiDung: b.id });
  expect(res.status).toBe(200); expect(res.body.nguon).toBe('du_lieu');
  expect(res.body.traLoi).toContain('100 001 đ'); expect(res.body.traLoi).toContain('80 001 đ');
  expect(res.body.traLoi).not.toMatch(/777 777|999 999|Private raw note/);
  expect(res.headers['cache-control']).toBe('no-store');
  expect(global.fetch).not.toHaveBeenCalled();
});
test('overdue deadlines belong only to the JWT account', async () => {
  const res = await ask(a, { tinNhan: 'Deadline sắp tới?' });
  expect(res.body.traLoi).toContain('My overdue'); expect(res.body.traLoi).not.toContain('Other account secret');
});
test('AI configuration is distinct from working local data mode', async () => {
  const res = await ask(a, { tinNhan: 'Gợi ý cách học', cheDo: 'ai', dongYGuiAI: true });
  expect(res.status).toBe(503); expect(res.body.code).toBe('CHATBOT_NOT_CONFIGURED');
  expect(global.fetch).not.toHaveBeenCalled();
});
test('opt-in context reaches only mocked Google, contains no raw notes or identity', async () => {
  process.env.CHATBOT_AI_ENABLED = 'true';
  process.env.GEMINI_API_KEY = 'test-only-not-a-real-key-2026';
  process.env.GEMINI_MODEL = 'gemini-3.5-flash-lite';
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Gợi ý minh họa từ bộ giả lập.' }] } }] }) });
  const res = await ask(a, { tinNhan: 'Gợi ý kế hoạch', cheDo: 'ai', dongYGuiAI: true, dungDuLieuCaNhan: true, idNguoiDung: b.id });
  expect(res.status).toBe(200); expect(res.body.nguon).toBe('ai');
  const payload = global.fetch.mock.calls[0][1].body;
  expect(payload).toContain('My overdue'); expect(payload).toContain('80001');
  expect(payload).not.toContain('Other account secret'); expect(payload).not.toContain('Private raw note');
  expect(payload).not.toContain(a.email); expect(payload).not.toContain(a.matKhau);
});

test.each([
  ['quota', { ok: false, status: 429 }, 429, 'CHATBOT_QUOTA'],
  ['timeout', Object.assign(new Error('private-provider-detail'), { name: 'TimeoutError' }), 504, 'CHATBOT_TIMEOUT'],
  ['invalid response', { ok: true, json: async () => { throw Error('private-provider-detail'); } }, 502, 'CHATBOT_PROVIDER'],
])('AI %s leaves local lookup and authenticated session usable', async (label, simulated, status, code) => {
  process.env.CHATBOT_AI_ENABLED='true'; process.env.GEMINI_API_KEY='test-only-not-a-real-key-2026';
  process.env.GEMINI_MODEL='gemini-3.5-flash-lite';
  if(simulated instanceof Error) global.fetch.mockRejectedValueOnce(simulated); else global.fetch.mockResolvedValueOnce(simulated);
  const response=await ask(a,{tinNhan:'Gợi ý kế hoạch học tập',cheDo:'ai',dongYGuiAI:true,dungDuLieuCaNhan:false});
  expect(response.status).toBe(status); expect(response.body.code).toBe(code);
  expect(JSON.stringify(response.body)).not.toMatch(/private-provider-detail|test-only-not-a-real-key/);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const local=await ask(a,{tinNhan:'Tháng này chi bao nhiêu?'});
  expect(local.status).toBe(200); expect(local.body.nguon).toBe('du_lieu'); expect(local.body.traLoi).toContain('80 001 đ');
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect((await request(app).get('/api/auth/ho-so').set('Authorization','Bearer '+a.token)).status).toBe(200);
});
