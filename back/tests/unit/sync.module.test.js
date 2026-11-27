jest.mock('../../src/prismaClient', () => ({
  $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  nguoiDung: { findUnique: jest.fn() },
  boTheOnTap: { findUnique: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
  moHinhEdgeAi: { findUnique: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
  thoiKhoaBieu: { findMany: jest.fn() },
  deadline: { findMany: jest.fn() },
  monHoc: { findMany: jest.fn() },
}));

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../../src/prismaClient');
const { validateBody } = require('../../src/middlewares/validate.middleware');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-sync-unit-tests';

function makeAuthHeader(userId = 42, matKhauDoiLuc = Date.now()) {
  prisma.nguoiDung.findUnique.mockResolvedValue({
    id: userId,
    matKhauDoiLuc: new Date(matKhauDoiLuc - 5000),
  });
  const token = jwt.sign({ id: userId, matKhauDoiLuc }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

function buildTestApp(mountPath, router) {
  const app = express();
  app.use(express.json({ limit: '500kb' }));
  app.use(mountPath, router);
  return app;
}

describe('validateBody Zod middleware', () => {
  test('returns 400 with first Zod issue message on invalid body', () => {
    const schema = z.object({ title: z.string({ error: 'Tiêu đề phải là chuỗi.' }).min(3, 'Tiêu đề tối thiểu 3 ký tự.') });
    const mw = validateBody(schema);
    const req = { body: { title: 'ab' } };
    const res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    const next = jest.fn();

    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Tiêu đề tối thiểu 3 ký tự.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('replaces req.body with parsed defaults and invokes next() when valid', () => {
    const schema = z.object({ count: z.number().int().optional().default(5) });
    const mw = validateBody(schema);
    const req = { body: {} };
    const res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    const next = jest.fn();

    mw(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({ count: 5 });
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('/api/sync endpoints', () => {
  let app;

  beforeAll(() => {
    const syncRoutes = require('../../src/modules/sync/sync.routes');
    app = buildTestApp('/api/sync', syncRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/sync/sm2 returns null when user has no synced deck', async () => {
    const auth = makeAuthHeader(42);
    prisma.boTheOnTap.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/sync/sm2').set('Authorization', auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deck: null });
    expect(prisma.boTheOnTap.findUnique).toHaveBeenCalledWith({ where: { idNguoiDung: 42 } });
  });

  test('PUT /api/sync/sm2 rejects invalid schema and >400 cards with HTTP 400', async () => {
    const auth = makeAuthHeader(42);

    const badVer = await request(app)
      .put('/api/sync/sm2')
      .set('Authorization', auth)
      .send({ version: 2, totalReviews: 0, cards: [] });
    expect(badVer.status).toBe(400);
    expect(prisma.boTheOnTap.upsert).not.toHaveBeenCalled();

    const tooManyCards = Array.from({ length: 401 }, (_, i) => ({
      id: `c_${i}`,
      docId: 'huong-dan-lifehub',
      matTruoc: `Câu hỏi ${i}`,
      matSau: `Đáp án ${i}`,
    }));
    const overflow = await request(app)
      .put('/api/sync/sm2')
      .set('Authorization', auth)
      .send({ version: 1, totalReviews: 0, cards: tooManyCards });
    expect(overflow.status).toBe(400);
    expect(overflow.body.message).toContain('400');
  });

  test('PUT and DELETE /api/sync/sm2 persist scoped to authenticated user', async () => {
    const auth = makeAuthHeader(42);
    const now = new Date('2026-11-26T10:00:00Z');
    prisma.boTheOnTap.upsert.mockResolvedValue({
      idNguoiDung: 42,
      phienBan: 1,
      tongLuotOn: 3,
      cacThe: [{ id: 'c1', docId: '7', docTitle: 'Python', matTruoc: 'GIL là gì?', matSau: 'Global Interpreter Lock', trang: 1, trichDan: '', repetitions: 1, interval: 1, easeFactor: 2.5, nextReviewAt: '2026-11-27', lastReviewedAt: null, lapses: 0 }],
      capNhatLuc: now,
    });

    const putRes = await request(app)
      .put('/api/sync/sm2')
      .set('Authorization', auth)
      .send({
        version: 1,
        totalReviews: 3,
        cards: [{ id: 'c1', docId: '7', docTitle: 'Python', matTruoc: 'GIL là gì?', matSau: 'Global Interpreter Lock', trang: 1 }],
      });

    expect(putRes.status).toBe(200);
    expect(putRes.body.deck.userId).toBe(42);
    expect(putRes.body.deck.totalReviews).toBe(3);
    expect(putRes.body.deck.updatedAt).toBe(now.getTime());

    prisma.boTheOnTap.deleteMany.mockResolvedValue({ count: 1 });
    const delRes = await request(app).delete('/api/sync/sm2').set('Authorization', auth);
    expect(delRes.status).toBe(200);
    expect(prisma.boTheOnTap.deleteMany).toHaveBeenCalledWith({ where: { idNguoiDung: 42 } });
  });

  test('PUT /api/sync/edge-ai validates tasks, rejects oversized payload with 413, and saves cleanly', async () => {
    const auth = makeAuthHeader(42);

    const bad = await request(app)
      .put('/api/sync/edge-ai')
      .set('Authorization', auth)
      .send({ version: 1, tasks: { finance_chi: {} } });
    expect(bad.status).toBe(400);

    const emptyTask = {
      classDocCounts: {},
      tokenCounts: {},
      classTokenTotals: {},
      userSamples: 0,
      feedbackHits: 0,
      feedbackTotal: 0,
      seenIds: [],
    };

    const bigTokens = {};
    for (let i = 0; i < 600; i++) {
      bigTokens[`feat_long_token_name_for_overflow_check_${i}_${'x'.repeat(580)}`] = i + 1;
    }
    const bigRes = await request(app)
      .put('/api/sync/edge-ai')
      .set('Authorization', auth)
      .send({
        version: 1,
        tasks: {
          finance_chi: { ...emptyTask, tokenCounts: { an_uong: bigTokens } },
          finance_thu: emptyTask,
          deadline_priority: emptyTask,
        },
      });
    expect(bigRes.status).toBe(413);

    const now = new Date('2026-11-26T10:05:00Z');
    prisma.moHinhEdgeAi.upsert.mockResolvedValue({
      idNguoiDung: 42,
      phienBan: 1,
      duLieu: {
        finance_chi: { ...emptyTask, userSamples: 4 },
        finance_thu: emptyTask,
        deadline_priority: emptyTask,
      },
      capNhatLuc: now,
    });

    const okRes = await request(app)
      .put('/api/sync/edge-ai')
      .set('Authorization', auth)
      .send({
        version: 1,
        tasks: {
          finance_chi: { ...emptyTask, userSamples: 4 },
          finance_thu: emptyTask,
          deadline_priority: emptyTask,
        },
      });
    expect(okRes.status).toBe(200);
    expect(okRes.body.model.tasks.finance_chi.userSamples).toBe(4);
  });

  test('DELETE /api/sync/edge-ai removes stored model for current user', async () => {
    const auth = makeAuthHeader(42);
    prisma.moHinhEdgeAi.deleteMany.mockResolvedValue({ count: 1 });

    const res = await request(app).delete('/api/sync/edge-ai').set('Authorization', auth);
    expect(res.status).toBe(200);
    expect(prisma.moHinhEdgeAi.deleteMany).toHaveBeenCalledWith({ where: { idNguoiDung: 42 } });
  });
});

describe('Zod route validation on planner and RAG endpoints', () => {
  test('POST /api/planner/generate and /apply-deadlines reject invalid inputs via Zod before touching DB', async () => {
    const plannerRoutes = require('../../src/modules/planner/planner.routes');
    const app = buildTestApp('/api/planner', plannerRoutes);
    const auth = makeAuthHeader(42);

    const resGen = await request(app)
      .post('/api/planner/generate')
      .set('Authorization', auth)
      .send({ prompt: 'a'.repeat(601) });
    expect(resGen.status).toBe(400);
    expect(resGen.body.message).toContain('600');
    expect(prisma.thoiKhoaBieu.findMany).not.toHaveBeenCalled();

    const resApply = await request(app)
      .post('/api/planner/apply-deadlines')
      .set('Authorization', auth)
      .send({ sessions: [] });
    expect(resApply.status).toBe(400);
    expect(resApply.body.message).toContain('1 đến 20');
  });

  test('POST /api/tai-lieu/:id/tao-on-tap rejects topic over 160 chars via Zod', async () => {
    const ragRoutes = require('../../src/modules/rag/rag.routes');
    const app = buildTestApp('/api/tai-lieu', ragRoutes);
    const auth = makeAuthHeader(42);

    const res = await request(app)
      .post('/api/tai-lieu/huong-dan-lifehub/tao-on-tap')
      .set('Authorization', auth)
      .send({ chuDe: 'x'.repeat(161), dungAI: false });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('160');
  });
});
