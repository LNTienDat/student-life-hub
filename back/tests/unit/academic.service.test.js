/**
 * academic.service.test.js
 * Unit tests cho tầng Service của Học tập & Điểm số (Academic)
 */

const {
  tinhGPAService,
  canhBaoMonNguyCoService,
  gpaTheoKyService,
  duDoanDiemService,
} = require('../../src/modules/academic/academic.service');

describe('Academic Service Unit Tests', () => {
  describe('tinhGPAService()', () => {
    test('trả về 0 khi không có môn học nào', () => {
      const { gpa, chiTiet } = tinhGPAService([]);
      expect(gpa).toBe('0');
      expect(chiTiet).toEqual([]);
    });

    test('tính đúng GPA tích lũy có trọng số tín chỉ của các môn đã có điểm', () => {
      const mockMonHocs = [
        {
          ten: 'Giải tích 1',
          tinChi: 3,
          diems: [
            { diem: 8, trongSo: 30 },
            { diem: 9, trongSo: 70 },
          ], // TB môn = 8.7
        },
        {
          ten: 'Lập trình Web',
          tinChi: 4,
          diems: [
            { diem: 9, trongSo: 40 },
            { diem: 10, trongSo: 60 },
          ], // TB môn = 9.6
        },
        {
          ten: 'Giáo dục thể chất',
          tinChi: 1,
          diems: [], // Chưa có điểm -> không tính vào tổng tín chỉ
        },
      ];

      const { gpa, chiTiet } = tinhGPAService(mockMonHocs);

      // Tổng điểm * tín chỉ: 8.7 * 3 + 9.6 * 4 = 26.1 + 38.4 = 64.5
      // Tổng tín chỉ: 3 + 4 = 7
      // GPA: 64.5 / 7 = 9.214... -> '9.21'
      expect(gpa).toBe('9.21');
      expect(chiTiet).toHaveLength(3);
      expect(chiTiet[0].diemMon).toBe('8.70');
      expect(chiTiet[1].diemMon).toBe('9.60');
      expect(chiTiet[2].diemMon).toBe('0.00');
    });
  });

  describe('canhBaoMonNguyCoService()', () => {
    test('lọc ra đúng các môn học có điểm trung bình dưới ngưỡng cảnh báo (mặc định 5.0)', () => {
      const mockMonHocs = [
        {
          ten: 'Toán cao cấp',
          diems: [{ diem: 4.2, trongSo: 100 }],
        },
        {
          ten: 'Vật lý 1',
          diems: [{ diem: 4.8, trongSo: 50 }],
        },
        {
          ten: 'Tiếng Anh',
          diems: [{ diem: 7.5, trongSo: 100 }],
        },
        {
          ten: 'Triết học',
          diems: [], // Chưa chấm -> không coi là nguy cơ
        },
      ];

      const nguyCo = canhBaoMonNguyCoService(mockMonHocs);
      expect(nguyCo).toHaveLength(2);
      expect(nguyCo.map((m) => m.ten)).toEqual(['Toán cao cấp', 'Vật lý 1']);
      expect(nguyCo[0].diemHienTai).toBe('4.20');
      expect(nguyCo[1].diemHienTai).toBe('4.80');
    });

    test('hỗ trợ tùy biến ngưỡng điểm cảnh báo', () => {
      const mockMonHocs = [
        {
          ten: 'Lập trình C++',
          diems: [{ diem: 6.2, trongSo: 100 }],
        },
      ];
      // Ngưỡng 6.5 -> môn 6.2 sẽ bị cảnh báo
      const nguyCo = canhBaoMonNguyCoService(mockMonHocs, 6.5);
      expect(nguyCo).toHaveLength(1);
      expect(nguyCo[0].ten).toBe('Lập trình C++');
    });
  });

  describe('gpaTheoKyService()', () => {
    test('tổng hợp chính xác điểm GPA trung bình theo từng học kỳ', () => {
      const mockMonHocs = [
        {
          ten: 'Nhập môn Tin học',
          tinChi: 3,
          hocKy: 'HK1_2025',
          diems: [{ diem: 8.0, trongSo: 100 }],
        },
        {
          ten: 'Toán rời rạc',
          tinChi: 3,
          hocKy: 'HK1_2025',
          diems: [{ diem: 6.0, trongSo: 100 }],
        },
        {
          ten: 'Cấu trúc dữ liệu',
          tinChi: 4,
          hocKy: 'HK2_2025',
          diems: [{ diem: 9.0, trongSo: 100 }],
        },
      ];

      const res = gpaTheoKyService(mockMonHocs);
      expect(res).toEqual([
        { hocKy: 'HK1_2025', gpa: '7.00' }, // (8*3 + 6*3) / 6 = 7.00
        { hocKy: 'HK2_2025', gpa: '9.00' },
      ]);
    });
  });

  describe('duDoanDiemService()', () => {
    test('tính đúng điểm cần đạt khi mục tiêu hoàn toàn khả thi', () => {
      // Đã có giữa kỳ: 8.0 với trọng số 30% -> tongDaBiet = 8.0 * 0.3 = 2.4
      // Trọng số còn lại là 70% (cuối kỳ)
      // Mục tiêu đạt môn là 7.0
      // Điểm cần đạt = (7.0 - 2.4) / 0.7 = 4.6 / 0.7 = 6.57
      const ketQua = duDoanDiemService(2.4, 70, 7.0);
      expect(ketQua.diemCanDat).toBe('6.57');
      expect(ketQua.khaThi).toBe(true);
    });

    test('báo không khả thi khi mục tiêu đòi hỏi điểm > 10.0', () => {
      // Đã có 2.0 ở 50% trọng số -> tongDaBiet = 1.0
      // Còn lại 50% trọng số
      // Mục tiêu 8.0 -> cần đạt (8.0 - 1.0) / 0.5 = 14.0 (> 10)
      const ketQua = duDoanDiemService(1.0, 50, 8.0);
      expect(ketQua.diemCanDat).toBe('14.00');
      expect(ketQua.khaThi).toBe(false);
    });
  });
});
