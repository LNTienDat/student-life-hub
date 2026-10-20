jest.mock('../../src/prismaClient', () => ({
  giaoDich: { create: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn() },
  nganSach: { upsert: jest.fn() },
  monHoc: { create: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn() },
  diem: { create: jest.fn() },
  thoiKhoaBieu: { create: jest.fn(), findFirst: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
}));

const prisma = require('../../src/prismaClient');
const finance = require('../../src/modules/finance/finance.controller');
const academic = require('../../src/modules/academic/academic.controller');
const timetable = require('../../src/modules/thoikhoabieu/thoikhoabieu.controller');

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};
const request = (body) => ({ user: { id: 42 }, params: { id: '7' }, body });
beforeEach(() => jest.resetAllMocks());

describe('financial input and updates', () => {
  test('accepts a decimal amount sent as a form string', async () => {
    const res = response();
    await finance.themGiaoDich(request({ loai: 'chi', danhMuc: 'an_uong', soTien: '25000.50' }), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(prisma.giaoDich.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ soTien: 25000.5, idNguoiDung: 42 }),
    }));
  });

  test.each(['100abc', 'Infinity', '1e309', true, [100]])('rejects invalid transaction amount %p before writing', async (soTien) => {
    const res = response();
    await finance.themGiaoDich(request({ loai: 'chi', danhMuc: 'an_uong', soTien }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.giaoDich.create).not.toHaveBeenCalled();
  });

  test('updating a transaction preserves its newly selected date and owner scope', async () => {
    prisma.giaoDich.findFirst.mockResolvedValue({ id: 7, loai: 'chi', danhMuc: 'an_uong' });
    prisma.giaoDich.updateMany.mockResolvedValue({ count: 1 });
    const res = response();
    await finance.suaGiaoDich(request({ ngayGiaoDich: '2026-09-20' }), res);
    expect(prisma.giaoDich.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 7, idNguoiDung: 42 },
      data: expect.objectContaining({ ngayGiaoDich: new Date('2026-09-20') }),
    }));
  });

  test('rejects an invalid edited date before writing', async () => {
    const res = response();
    await finance.suaGiaoDich(request({ ngayGiaoDich: 'not-a-date' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.giaoDich.updateMany).not.toHaveBeenCalled();
  });

  test('cannot turn salary into an expense without choosing an expense category', async () => {
    prisma.giaoDich.findFirst.mockResolvedValue({ id: 7, loai: 'thu', danhMuc: 'luong' });
    const res = response();
    await finance.suaGiaoDich(request({ loai: 'chi' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.giaoDich.updateMany).not.toHaveBeenCalled();
  });

  test('cannot edit another user transaction', async () => {
    prisma.giaoDich.findFirst.mockResolvedValue(null);
    const res = response();
    await finance.suaGiaoDich(request({ soTien: 50000 }), res);
    expect(prisma.giaoDich.findFirst).toHaveBeenCalledWith({ where: { id: 7, idNguoiDung: 42 } });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(prisma.giaoDich.updateMany).not.toHaveBeenCalled();
  });

  test.each([{ thang: 1.5, nam: 2026 }, { thang: 10, nam: '2026abc' }])('rejects malformed budget month/year %p', async (period) => {
    const res = response();
    await finance.datNganSach(request({ danhMuc: 'an_uong', soTienToiDa: 100000, ...period }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.nganSach.upsert).not.toHaveBeenCalled();
  });
});

test('saving a budget updates only the authenticated user category and month', async () => {
  const res = response();
  await finance.datNganSach(request({ danhMuc: 'an_uong', soTienToiDa: '1500000', thang: 10, nam: 2026 }), res);
  expect(res.status).toHaveBeenCalledWith(200);
  expect(prisma.nganSach.upsert).toHaveBeenCalledWith({
    where: { idNguoiDung_danhMuc_thang_nam: { idNguoiDung: 42, danhMuc: 'an_uong', thang: 10, nam: 2026 } },
    create: { danhMuc: 'an_uong', soTienToiDa: 1500000, thang: 10, nam: 2026, idNguoiDung: 42 },
    update: { soTienToiDa: 1500000 },
  });
});

describe('academic input', () => {
  test('accepts integer credits sent as a form string', async () => {
    const res = response();
    await academic.themMonHoc(request({ ten: 'Toán', hocKy: 'HK1', tinChi: '3' }), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(prisma.monHoc.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tinChi: 3, idNguoiDung: 42 }),
    }));
  });

  test.each([3.5, '3 credits'])('rejects fractional or malformed credits %p', async (tinChi) => {
    const res = response();
    await academic.themMonHoc(request({ ten: 'Toán', hocKy: 'HK1', tinChi }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.monHoc.create).not.toHaveBeenCalled();
  });

  test('rejects malformed score rather than silently truncating it', async () => {
    prisma.monHoc.findFirst.mockResolvedValue({ id: 7 });
    const res = response();
    await academic.themDiem(request({ idMonHoc: 7, loaiDanhGia: 'Thi', diem: '8abc', trongSo: 50 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.diem.create).not.toHaveBeenCalled();
  });

  test('allows zero as a valid score with a positive decimal weight', async () => {
    prisma.monHoc.findFirst.mockResolvedValue({ id: 7 });
    const res = response();
    await academic.themDiem(request({ idMonHoc: 7, loaiDanhGia: 'Thi', diem: '0', trongSo: '12.5' }), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(prisma.diem.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ diem: 0, trongSo: 12.5 }),
    }));
  });

  test('rejects non-numeric prediction target before querying courses', async () => {
    const res = response();
    await academic.duDoanDiem({ ...request({ mucTieu: 'abc', trongSoConLai: 50 }), params: { idMonHoc: '7' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.monHoc.findFirst).not.toHaveBeenCalled();
  });
});

describe('timetable input', () => {
  test.each(['7:00', '25:00', '07:99'])('rejects malformed start time %p', async (gioBatDau) => {
    const res = response();
    await timetable.themBuoiHoc(request({ tenMon: 'Toán', thu: 2, gioBatDau, gioKetThuc: '09:00' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.thoiKhoaBieu.create).not.toHaveBeenCalled();
  });

  test('checks a partial time edit against the stored end time', async () => {
    prisma.thoiKhoaBieu.findFirst.mockResolvedValue({ tenMon: 'Toán', thu: 2, gioBatDau: '07:00', gioKetThuc: '09:00' });
    const res = response();
    await timetable.suaBuoiHoc(request({ gioBatDau: '10:00' }), res);
    expect(prisma.thoiKhoaBieu.findFirst).toHaveBeenCalledWith({ where: { id: 7, idNguoiDung: 42 } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.thoiKhoaBieu.updateMany).not.toHaveBeenCalled();
  });

  test('allows a valid partial time edit scoped to the current owner', async () => {
    prisma.thoiKhoaBieu.findFirst.mockResolvedValue({ tenMon: 'Toán', thu: 2, gioBatDau: '07:00', gioKetThuc: '09:00' });
    prisma.thoiKhoaBieu.updateMany.mockResolvedValue({ count: 1 });
    await timetable.suaBuoiHoc(request({ gioKetThuc: '10:00' }), response());
    expect(prisma.thoiKhoaBieu.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 7, idNguoiDung: 42 },
      data: expect.objectContaining({ gioKetThuc: '10:00' }),
    }));
  });
});
