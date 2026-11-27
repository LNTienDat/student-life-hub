const { z } = require('zod');

const generatePlanSchema = z.object({
  prompt: z
    .string({ error: 'Mô tả mong muốn tối đa 600 ký tự.' })
    .max(600, 'Mô tả mong muốn tối đa 600 ký tự.')
    .optional()
    .default(''),
  weekStart: z
    .string({ error: 'Ngày bắt đầu tuần không hợp lệ.' })
    .max(32, 'Ngày bắt đầu tuần không hợp lệ.')
    .nullish()
    .transform((v) => v ?? ''),
  semester: z
    .string({ error: 'Học kỳ không hợp lệ.' })
    .max(64, 'Học kỳ không hợp lệ.')
    .nullish()
    .transform((v) => v ?? ''),
  constraints: z
    .record(z.string(), z.unknown())
    .nullish()
    .transform((v) => v ?? {}),
  useAI: z.boolean().optional().default(true),
  dongYGuiAI: z.boolean().optional().default(false),
});

const sessionItemSchema = z.object({
  tieuDe: z
    .string({ error: 'Dữ liệu phiên ôn tập không hợp lệ.' })
    .trim()
    .min(1, 'Dữ liệu phiên ôn tập không hợp lệ.')
    .max(180, 'Dữ liệu phiên ôn tập không hợp lệ.'),
  ngayHoc: z
    .string({ error: 'Dữ liệu phiên ôn tập không hợp lệ.' })
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dữ liệu phiên ôn tập không hợp lệ.'),
  gioBatDau: z
    .string({ error: 'Dữ liệu phiên ôn tập không hợp lệ.' })
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Dữ liệu phiên ôn tập không hợp lệ.'),
  gioKetThuc: z
    .string({ error: 'Dữ liệu phiên ôn tập không hợp lệ.' })
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Dữ liệu phiên ôn tập không hợp lệ.'),
  idMonHoc: z.union([z.number(), z.string()]).nullable().optional(),
  reasons: z.array(z.string()).max(20).optional(),
  priorityLevel: z.string().max(32).optional(),
});

const applyDeadlinesSchema = z.object({
  sessions: z
    .array(sessionItemSchema, { error: 'Chọn từ 1 đến 20 phiên ôn tập để lưu.' })
    .min(1, 'Chọn từ 1 đến 20 phiên ôn tập để lưu.')
    .max(20, 'Chọn từ 1 đến 20 phiên ôn tập để lưu.'),
});

module.exports = {
  generatePlanSchema,
  applyDeadlinesSchema,
};
