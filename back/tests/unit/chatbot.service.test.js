/**
 * chatbot.service.test.js
 * Unit tests cho module Context Injection của chatbot
 */

// Mock prismaClient
jest.mock('../../src/prismaClient', () => ({
  monHoc: { findMany: jest.fn() },
  deadline: { findMany: jest.fn() },
  giaoDich: { findMany: jest.fn() },
  thoiKhoaBieu: { findMany: jest.fn() },
}));

const prisma = require('../../src/prismaClient');
const { layNguCanhSinhVien, layThuTrongTuan, formatTien } = require('../../src/modules/chatbot/chatbot.service');

describe('chatbot.service — Context Injection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('layThuTrongTuan()', () => {
    test('Thứ 2 (Monday) → trả về 2', () => {
      // 2026-09-21 là thứ 2
      const date = new Date(2026, 8, 21); // Month is 0-indexed
      expect(layThuTrongTuan(date)).toBe(2);
    });

    test('Chủ nhật (Sunday) → trả về 8', () => {
      // 2026-09-20 là chủ nhật
      const date = new Date(2026, 8, 20);
      expect(layThuTrongTuan(date)).toBe(8);
    });

    test('Thứ 7 (Saturday) → trả về 7', () => {
      // 2026-09-19 là thứ 7
      const date = new Date(2026, 8, 19);
      expect(layThuTrongTuan(date)).toBe(7);
    });
  });

  describe('formatTien()', () => {
    test('Số lớn >= 1 triệu → format "Xtr"', () => {
      expect(formatTien(2500000)).toBe('2.5tr');
      expect(formatTien(1000000)).toBe('1.0tr');
    });

    test('Số vừa >= 1000 → format "Xk"', () => {
      expect(formatTien(50000)).toBe('50k');
      expect(formatTien(1000)).toBe('1k');
    });

    test('Số nhỏ < 1000 → format "Xđ"', () => {
      expect(formatTien(500)).toBe('500đ');
      expect(formatTien(0)).toBe('0đ');
    });
  });

  describe('layNguCanhSinhVien()', () => {
    test('Trả về context đầy đủ khi có dữ liệu', async () => {
      prisma.monHoc.findMany.mockResolvedValue([
        { ten: 'Toán cao cấp', tinChi: 3, diems: [{ diem: 8, trongSo: 50 }, { diem: 7, trongSo: 50 }] },
        { ten: 'Lý đại cương', tinChi: 2, diems: [{ diem: 4, trongSo: 100 }] },
      ]);

      prisma.deadline.findMany.mockResolvedValue([
        {
          tieuDe: 'Bài tập lớn Toán',
          hanChot: new Date(2026, 8, 25),
          doUuTien: 'cao',
          monHoc: { ten: 'Toán cao cấp' },
        },
      ]);

      prisma.giaoDich.findMany.mockResolvedValue([
        { loai: 'thu', soTien: 5000000, danhMuc: 'luong' },
        { loai: 'chi', soTien: 200000, danhMuc: 'an_uong' },
      ]);

      prisma.thoiKhoaBieu.findMany.mockResolvedValue([
        { tenMon: 'Toán cao cấp', gioBatDau: '07:00', gioKetThuc: '09:00', phongHoc: 'A101' },
      ]);

      const result = await layNguCanhSinhVien(1);

      // Kiểm tra chứa thông tin GPA
      expect(result).toContain('GPA tích lũy');

      // Kiểm tra chứa thông tin deadline
      expect(result).toContain('Bài tập lớn Toán');
      expect(result).toContain('🔴'); // ưu tiên cao

      // Kiểm tra chứa thông tin tài chính
      expect(result).toContain('Tài chính');
      expect(result).toContain('5.0tr'); // thu 5 triệu

      // Kiểm tra chứa thông tin lịch học
      expect(result).toContain('Toán cao cấp');
      expect(result).toContain('07:00-09:00');
      expect(result).toContain('A101');
    });

    test('Trả về context mặc định khi không có dữ liệu', async () => {
      prisma.monHoc.findMany.mockResolvedValue([]);
      prisma.deadline.findMany.mockResolvedValue([]);
      prisma.giaoDich.findMany.mockResolvedValue([]);
      prisma.thoiKhoaBieu.findMany.mockResolvedValue([]);

      const result = await layNguCanhSinhVien(1);

      expect(result).toContain('Chưa có dữ liệu môn học');
      expect(result).toContain('Không có deadline');
      expect(result).toContain('Chưa có giao dịch');
    });

    test('Hiển thị cảnh báo môn nguy cơ khi điểm dưới 5', async () => {
      prisma.monHoc.findMany.mockResolvedValue([
        { ten: 'Hóa học', tinChi: 2, diems: [{ diem: 3.5, trongSo: 100 }] },
      ]);
      prisma.deadline.findMany.mockResolvedValue([]);
      prisma.giaoDich.findMany.mockResolvedValue([]);
      prisma.thoiKhoaBieu.findMany.mockResolvedValue([]);

      const result = await layNguCanhSinhVien(1);

      expect(result).toContain('Môn nguy cơ');
      expect(result).toContain('Hóa học');
    });
  });
});
