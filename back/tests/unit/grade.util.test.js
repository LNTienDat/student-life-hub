const { tinhDiemMon, quyDoiHe4, quyDoiDiemChu, convertInputToScale10 } = require('../../src/utils/grade.util');

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

  describe('8-level / 9-level scales & input conversion', () => {
    test('quy đổi đúng chuẩn 8 bậc (có B+, C+, D+) và điểm chữ', () => {
      expect(quyDoiHe4(8.2, '8_level')).toBe(3.5);
      expect(quyDoiDiemChu(8.2, '8_level')).toBe('B+');
      expect(quyDoiHe4(6.7, '8_level')).toBe(2.5);
      expect(quyDoiDiemChu(6.7, '8_level')).toBe('C+');
      expect(quyDoiHe4(5.1, '8_level')).toBe(1.5);
      expect(quyDoiDiemChu(5.1, '8_level')).toBe('D+');
      expect(quyDoiHe4(8.7, '9_level')).toBe(3.7);
      expect(quyDoiDiemChu(9.2, '9_level')).toBe('A+');
    });

    test('convertInputToScale10 chuyển đổi chính xác từ thang 10, thang 4 và điểm chữ', () => {
      expect(convertInputToScale10({ value: '8.4', inputScale: '10' })).toBe(8.4);
      expect(convertInputToScale10({ value: '3.5', inputScale: '4', gradeScale: '8_level' })).toBe(8);
      expect(convertInputToScale10({ value: 'B+', inputScale: 'letter', gradeScale: '8_level' })).toBe(8);
      expect(convertInputToScale10({ value: 'A+', inputScale: 'letter', gradeScale: '9_level' })).toBe(9);
      expect(Number.isNaN(convertInputToScale10({ value: '4.5', inputScale: '4' }))).toBe(true);
    });
  });
});
