const { z } = require('zod');

const generateStudyPackSchema = z.object({
  soLuong: z.union([z.number(), z.string()]).nullable().optional(),
  chuDe: z
    .string({ error: 'Chủ đề ôn tập tối đa 160 ký tự.' })
    .max(160, 'Chủ đề ôn tập tối đa 160 ký tự.')
    .nullish()
    .transform((v) => v ?? ''),
  dungAI: z.boolean().optional().default(true),
});

module.exports = {
  generateStudyPackSchema,
};
