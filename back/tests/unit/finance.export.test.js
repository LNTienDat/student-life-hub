jest.mock('../../src/prismaClient', () => ({ giaoDich: { findMany: jest.fn() } }));
const prisma = require('../../src/prismaClient');
const { xuatBaoCaoTaiChinhExcel } = require('../../src/modules/finance/finance.controller');
const { FINANCE } = require('../../src/constants');
test('an oversized report fails explicitly instead of silently exporting partial totals', async () => {
  prisma.giaoDich.findMany.mockResolvedValue(Array(FINANCE.MAX_EXPORT_RECORDS + 1).fill({}));
  const res = { status: jest.fn(), json: jest.fn(), setHeader: jest.fn() }; res.status.mockReturnValue(res);
  await xuatBaoCaoTaiChinhExcel({ user: { id: 42 }, query: { thang: '1', nam: '2026' } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.setHeader).not.toHaveBeenCalled();
  expect(prisma.giaoDich.findMany.mock.calls[0][0]).toMatchObject({ where: { idNguoiDung: 42 }, take: FINANCE.MAX_EXPORT_RECORDS + 1 });
});
