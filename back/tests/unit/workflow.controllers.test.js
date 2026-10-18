jest.mock('../../src/prismaClient', () => ({
  deadline: { updateMany: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
  monHoc: { findMany: jest.fn() },
  thoiKhoaBieu: { findMany: jest.fn() },
}));
const prisma = require('../../src/prismaClient');
const deadline = require('../../src/modules/deadline/deadline.controller');
const academic = require('../../src/modules/academic/academic.controller');
const timetable = require('../../src/modules/thoikhoabieu/thoikhoabieu.controller');
const response = () => { const res = { status: jest.fn(), json: jest.fn() }; res.status.mockReturnValue(res); return res; };
beforeEach(() => jest.clearAllMocks());
test('checklist update cannot modify a deadline belonging to another user', async () => {
  prisma.deadline.updateMany.mockResolvedValue({ count: 0 });
  const res = response();
  await deadline.suaDeadline({ user: { id: 42 }, params: { id: '99' }, body: { checklist: [{ id: 'a', title: 'Do it', done: true }] } }, res);
  expect(prisma.deadline.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 99, idNguoiDung: 42 } }));
  expect(res.status).toHaveBeenCalledWith(404);
  expect(prisma.deadline.findUnique).not.toHaveBeenCalled();
});
test('invalid checklist is rejected before any database write', async () => {
  const res = response();
  await deadline.suaDeadline({ user: { id: 42 }, params: { id: '1' }, body: { checklist: [{ id: 'a', title: '', done: true }] } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(prisma.deadline.updateMany).not.toHaveBeenCalled();
});
test('semester filters GPA by user and term', async () => {
  prisma.monHoc.findMany.mockResolvedValue([]);
  await academic.tinhGPA({ user: { id: 42 }, query: { hocKy: 'HK1' } }, response());
  expect(prisma.monHoc.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { idNguoiDung: 42, hocKy: 'HK1' } }));
});
test('semester keeps unassigned timetable entries visible', async () => {
  prisma.thoiKhoaBieu.findMany.mockResolvedValue([]);
  await timetable.layThoiKhoaBieu({ user: { id: 42 }, query: { hocKy: 'HK1' } }, response());
  expect(prisma.thoiKhoaBieu.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { idNguoiDung: 42, OR: [{ hocKy: 'HK1' }, { hocKy: '' }] } }));
});
test('pending and waiting tasks both remain in upcoming deadlines', async () => {
  prisma.deadline.findMany.mockResolvedValue([]);
  await deadline.deadlineSapToi({ user: { id: 42 }, query: { hocKy: 'HK1' } }, response());
  expect(prisma.deadline.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ idNguoiDung: 42, trangThai: { not: 'hoan_thanh' } }) }));
});
