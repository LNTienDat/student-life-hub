const { z } = require('zod');

const sm2CardSchema = z.object({
  id: z.string({ error: 'Mã thẻ không hợp lệ.' }).trim().min(1, 'Mã thẻ không hợp lệ.').max(120),
  docId: z.string({ error: 'Mã tài liệu thẻ không hợp lệ.' }).trim().min(1, 'Mã tài liệu thẻ không hợp lệ.').max(120),
  docTitle: z.string().max(240).optional().default('Tài liệu'),
  matTruoc: z.string({ error: 'Nội dung mặt trước thẻ không hợp lệ.' }).trim().min(1, 'Nội dung mặt trước thẻ không hợp lệ.').max(1000),
  matSau: z.string({ error: 'Nội dung mặt sau thẻ không hợp lệ.' }).trim().min(1, 'Nội dung mặt sau thẻ không hợp lệ.').max(2000),
  trang: z.number().int().min(1).max(10000).optional().default(1),
  trichDan: z.string().max(600).optional().default(''),
  repetitions: z.number().int().min(0).max(10000).optional().default(0),
  interval: z.number().finite().min(0).max(36500).optional().default(0),
  easeFactor: z.number().finite().min(1.3).max(5).optional().default(2.5),
  nextReviewAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày ôn tập không hợp lệ.').nullable().optional(),
  lastReviewedAt: z.string().max(64).nullable().optional(),
  lapses: z.number().int().min(0).max(10000).optional().default(0),
  needsRelearn: z.boolean().optional(),
  createdAt: z.string().max(64).nullable().optional(),
});

const sm2SyncSchema = z.object({
  version: z.literal(1, { error: 'Phiên bản bộ thẻ không được hỗ trợ.' }),
  totalReviews: z.number().int().min(0).max(1000000).optional().default(0),
  cards: z
    .array(sm2CardSchema, { error: 'Danh sách thẻ ôn tập không hợp lệ.' })
    .max(400, 'Bộ thẻ đồng bộ tối đa 400 thẻ.'),
});

const edgeTaskStateSchema = z.object({
  classDocCounts: z.record(z.string(), z.number().finite().min(0)).default({}),
  tokenCounts: z.record(z.string(), z.record(z.string(), z.number().finite().min(0))).default({}),
  classTokenTotals: z.record(z.string(), z.number().finite().min(0)).default({}),
  userSamples: z.number().int().min(0).max(1000000).default(0),
  feedbackHits: z.number().int().min(0).max(1000000).default(0),
  feedbackTotal: z.number().int().min(0).max(1000000).default(0),
  seenIds: z.array(z.string().max(120)).max(500).default([]),
});

const edgeModelSyncSchema = z.object({
  version: z.literal(1, { error: 'Phiên bản dữ liệu gợi ý không được hỗ trợ.' }),
  updatedAt: z.number().finite().optional(),
  tasks: z.object(
    {
      finance_chi: edgeTaskStateSchema,
      finance_thu: edgeTaskStateSchema,
      deadline_priority: edgeTaskStateSchema,
    },
    { error: 'Cấu trúc dữ liệu gợi ý cá nhân không hợp lệ.' },
  ),
});

module.exports = {
  sm2CardSchema,
  sm2SyncSchema,
  edgeTaskStateSchema,
  edgeModelSyncSchema,
};
