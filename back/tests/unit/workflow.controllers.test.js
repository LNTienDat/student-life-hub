jest.mock('../../src/prismaClient', () => ({
  $transaction: jest.fn(async action => action(require('../../src/prismaClient'))),
  deadline: { updateMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
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
  prisma.deadline.findFirst.mockResolvedValue(null);
  const res = response();
  await deadline.suaDeadline({ user: { id: 42 }, params: { id: '99' }, body: { checklist: [{ id: 'a', title: 'Do it', done: true }] } }, res);
  expect(prisma.deadline.findFirst).toHaveBeenCalledWith({ where: { id: 99, idNguoiDung: 42, xoaLuc: null } });
  expect(res.status).toHaveBeenCalledWith(404);
  expect(prisma.deadline.findUnique).not.toHaveBeenCalled();
  expect(prisma.deadline.update).not.toHaveBeenCalled();
});
test('invalid checklist is rejected before any database write', async () => {
  const res = response();
  await deadline.suaDeadline({ user: { id: 42 }, params: { id: '1' }, body: { checklist: [{ id: 'a', title: '', done: true }] } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(prisma.deadline.updateMany).not.toHaveBeenCalled();
});
test('semester filters GPA by normalized term while keeping database ownership scope', async () => {
  prisma.monHoc.findMany.mockResolvedValue([{ten:'Old',hocKy:'hk1',tinChi:3,diems:[{diem:8,trongSo:100}]},{ten:'Other',hocKy:'HK2',tinChi:3,diems:[{diem:2,trongSo:100}]}]);
  const res=response();await academic.tinhGPA({user:{id:42},query:{hocKy:' HK1 '}},res);
  expect(prisma.monHoc.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{idNguoiDung:42}}));
  expect(res.json.mock.calls[0][0].gpa).toBe('8.00');
});
test('semester keeps old lowercase and unassigned timetable entries visible but excludes other terms', async () => {
  prisma.thoiKhoaBieu.findMany.mockResolvedValue([{id:1,hocKy:'hk1'},{id:2,hocKy:''},{id:3,hocKy:'HK2'}]);
  const res=response();await timetable.layThoiKhoaBieu({user:{id:42},query:{hocKy:'HK1'}},res);
  expect(prisma.thoiKhoaBieu.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{idNguoiDung:42}}));
  expect(res.json.mock.calls[0][0].thoiKhoaBieu.map(item=>item.id)).toEqual([1,2]);
});
test('pending and waiting tasks both remain in upcoming deadlines', async () => {
  prisma.deadline.findMany.mockResolvedValue([]);
  await deadline.deadlineSapToi({ user: { id: 42 }, query: { hocKy: 'HK1' } }, response());
  expect(prisma.deadline.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ idNguoiDung: 42, trangThai: { not: 'hoan_thanh' } }) }));
});
