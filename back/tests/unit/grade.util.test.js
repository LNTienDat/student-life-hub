const { tinhDiemMon, quyDoiHe4 } = require('../../src/utils/grade.util');

describe('Grade Util Tests', () => {
  describe('tinhDiemMon()', () => {
    test('trả về 0 khi không có cột điểm nào', () => {
      expect(tinhDiemMon([])).toEqual({ diemTrungBinh: 0, tongTrongSo: 0 });
      expect(tinhDiemMon(null)).toEqual({ diemTrungBinh: 0, tongTrongSo: 0 });
    });

    test('tính đúng điểm trung bình khi đủ 100% trọng số', () => {
      const diems = [
        { diem: 8, trongSo: 30 },
        { diem: 9, trongSo: 70 },
      ];
      const ketQua = tinhDiemMon(diems);
      expect(ketQua.tongTrongSo).toBe(100);
      expect(ketQua.diemTrungBinh).toBe(8.7);
    });

    test('chuẩn hóa chính xác khi môn học mới chấm một phần trọng số (tránh tụt GPA dở dang)', () => {
      // Chỉ mới có điểm chuyên cần 10% và giữa kỳ 20%
      const diems = [
        { diem: 9, trongSo: 10 },
        { diem: 8, trongSo: 20 },
      ];
      const ketQua = tinhDiemMon(diems);
      // (9*10 + 8*20) / (10 + 20) = 250 / 30 = 8.33
      expect(ketQua.tongTrongSo).toBe(30);
      expect(ketQua.diemTrungBinh).toBe(8.33);
    });
  });

  describe('quyDoiHe4()', () => {
    test('quy đổi điểm xuất sắc/giỏi (>= 8.5 -> 4.0)', () => {
      expect(quyDoiHe4(10)).toBe(4.0);
      expect(quyDoiHe4(8.5)).toBe(4.0);
    });

    test('quy đổi điểm khá (7.0 - 8.4 -> 3.0)', () => {
      expect(quyDoiHe4(8.4)).toBe(3.0);
      expect(quyDoiHe4(7.0)).toBe(3.0);
    });

    test('quy đổi điểm trung bình khá (5.5 - 6.9 -> 2.0)', () => {
      expect(quyDoiHe4(6.9)).toBe(2.0);
      expect(quyDoiHe4(5.5)).toBe(2.0);
    });

    test('quy đổi điểm trung bình (4.0 - 5.4 -> 1.0)', () => {
      expect(quyDoiHe4(5.4)).toBe(1.0);
      expect(quyDoiHe4(4.0)).toBe(1.0);
    });

    test('quy đổi điểm liệt / rớt môn (< 4.0 -> 0.0)', () => {
      expect(quyDoiHe4(3.9)).toBe(0);
      expect(quyDoiHe4(0)).toBe(0);
    });
  });
});
