jest.mock('../../src/prismaClient', () => ({
  nguoiDung: { findUnique: jest.fn().mockResolvedValue({ hocKyHienTai: '' }) },
  dieuChinhLich: { findMany: jest.fn().mockResolvedValue([]) },
  danhMucTaiChinh: { findMany: jest.fn().mockResolvedValue([]) },
  monHoc: { findMany: jest.fn() }, deadline: { findMany: jest.fn(), count: jest.fn() },
  giaoDich: { groupBy: jest.fn() }, nganSach: { findMany: jest.fn() }, thoiKhoaBieu: { findMany: jest.fn() },
}));
const prisma = require('../../src/prismaClient');
const { layDuLieuSinhVien, timChuDe, traLoiDuLieu, layThuTrongTuan, formatTien } = require('../../src/modules/chatbot/chatbot.service');
const now = new Date('2026-10-31T18:00:00Z'); // Sunday Nov 1, 01:00 in Vietnam
beforeEach(() => {
  jest.clearAllMocks();
  for (const model of ['monHoc', 'nganSach', 'thoiKhoaBieu']) prisma[model].findMany.mockResolvedValue([]);
  prisma.deadline.findMany.mockResolvedValue([]); prisma.deadline.count.mockResolvedValue(0);
  prisma.giaoDich.groupBy.mockResolvedValue([]);
});
test('uses the Vietnam date even when the server is still on the previous UTC day', () => {
  expect(layThuTrongTuan(now)).toBe(8);
  expect(layThuTrongTuan(new Date('2026-11-01T18:00:00Z'))).toBe(2);
});
test('money retains exact amounts and supports negative balances', () => {
  expect(formatTien(100001)).toBe('100 001 đ'); expect(formatTien(-20000)).toBe('-20 000 đ');
});
test('recognizes supported facts and avoids answering advice or historical periods with current data', () => {
  expect(timChuDe('GPA hiện tại của mình?')).toEqual(['hocTap']);
  expect(timChuDe('Tháng này chi bao nhiêu?')).toEqual(['taiChinh']);
  expect(timChuDe('Ngày mai học gì?')).toEqual(['lichHoc']);
  expect(timChuDe('Gợi ý kế hoạch học để tăng GPA')).toEqual([]);
  expect(timChuDe('Thu chi tháng trước?')).toEqual([]);
});
test('queries only the requested topic and uses both Vietnam month bounds', async () => {
  await layDuLieuSinhVien(42, ['taiChinh'], now);
  expect(prisma.giaoDich.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: {
    idNguoiDung: 42, ngayGiaoDich: { gte: new Date('2026-10-31T17:00:00Z'), lt: new Date('2026-11-30T17:00:00Z') },
  } }));
  expect(prisma.nganSach.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { idNguoiDung: 42, thang: 11, nam: 2026 } }));
  expect(prisma.monHoc.findMany).not.toHaveBeenCalled(); expect(prisma.deadline.findMany).not.toHaveBeenCalled();
});
test('no grades is different from a genuine GPA of zero', async () => {
  prisma.monHoc.findMany.mockResolvedValue([{ ten: 'A', tinChi: 2, diems: [] }]);
  const empty = await layDuLieuSinhVien(42, ['hocTap'], now);
  expect(empty.hocTap.gpa).toBeNull(); expect(traLoiDuLieu(empty, 'GPA')).toContain('Chưa có điểm');
  prisma.monHoc.findMany.mockResolvedValue([{ ten: 'A', tinChi: 2, diems: [{ diem: 0, trongSo: 100 }] }]);
  expect((await layDuLieuSinhVien(42, ['hocTap'], now)).hocTap.gpa).toBe('0.00');
});
test('flags legacy invalid grade weights and warns instead of silently treating the result as valid', async () => {
  prisma.monHoc.findMany.mockResolvedValue([{ ten: 'A', tinChi: 2, diems: [{ diem: 8, trongSo: 40 }, { diem: 10, trongSo: 70 }] }]);
  expect(traLoiDuLieu(await layDuLieuSinhVien(42, ['hocTap'], now), 'GPA')).toContain('vượt 100%');
});
test('overdue work is included separately from upcoming work, scoped to this account', async () => {
  prisma.deadline.findMany.mockResolvedValueOnce([{ tieuDe: 'Old task', hanChot: new Date('2026-10-30T17:00:00Z'), doUuTien: 'cao' }]).mockResolvedValueOnce([]);
  prisma.deadline.count.mockResolvedValueOnce(6).mockResolvedValueOnce(0);
  const result = await layDuLieuSinhVien(42, ['deadline'], now);
  expect(result.deadline.tongQuaHan).toBe(6);
  expect(traLoiDuLieu(result, 'Deadline')).toContain('Hiển thị tối đa 5');
  expect(traLoiDuLieu(result, 'Deadline')).toContain('Khẩn cấp');
  for (const [query] of [...prisma.deadline.findMany.mock.calls,...prisma.deadline.count.mock.calls]) {
    expect(query.where.idNguoiDung).toBe(42);
    expect(query.where.xoaLuc).toBeNull();
  }
  expect(prisma.deadline.findMany.mock.calls[0][0].where.hanChot).toEqual({ lt: now });
});
test('summary omits raw transaction descriptions and account secrets', async () => {
  prisma.giaoDich.groupBy.mockResolvedValue([{ loai: 'thu', danhMuc: 'luong', _sum: { soTien: 100001 }, _count: { _all: 1 } }, { loai: 'chi', danhMuc: 'an_uong', _sum: { soTien: 20000 }, _count: { _all: 1 } }]);
  const data = await layDuLieuSinhVien(42, ['taiChinh'], now);
  expect(data.taiChinh.soDu).toBe(80001);
  expect(traLoiDuLieu(data, 'thu chi')).toContain('80 001 đ');
  expect(JSON.stringify(data)).not.toMatch(/matKhau|email|idNguoiDung|moTa/);
});
test('today and tomorrow follow Vietnam weekdays and keep semester scope explicit', async () => {
  prisma.thoiKhoaBieu.findMany.mockResolvedValue([{ tenMon: 'Sunday', thu: 8, gioBatDau: '07:00', gioKetThuc: '09:00', phongHoc: 'A1', hocKy: 'HK1' }, { tenMon: 'Monday', thu: 2, gioBatDau: '07:00', gioKetThuc: '09:00', hocKy: 'HK2' }]);
  const data = await layDuLieuSinhVien(42, ['lichHoc'], now);
  expect(traLoiDuLieu(data, 'Ngày mai học gì?')).toContain('Monday');
  expect(traLoiDuLieu(data, 'Ngày mai học gì?')).not.toContain('Sunday');
  expect(traLoiDuLieu(data, 'Hôm nay học gì?')).toContain('HK1');
});
test('a data failure is propagated rather than returned as an empty account', async () => {
  prisma.monHoc.findMany.mockRejectedValue(new Error('DB unavailable'));
  await expect(layDuLieuSinhVien(42, ['hocTap'], now)).rejects.toThrow('DB unavailable');
});
