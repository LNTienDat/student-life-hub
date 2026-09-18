const {
  chongCongThuc,
  thongKeTaiChinhService,
  kiemTraNganSachService,
} = require('../../src/modules/finance/finance.service');

describe('Finance Service Unit Tests', () => {
  describe('chongCongThuc() - Phòng vệ CSV/Formula Injection', () => {
    test('thêm dấu nháy đơn vào trước các chuỗi bắt đầu bằng ký tự công thức Excel', () => {
      expect(chongCongThuc('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(chongCongThuc('+123456')).toBe("'+123456");
      expect(chongCongThuc('-CMD.EXE')).toBe("'-CMD.EXE");
      expect(chongCongThuc('@SUM()')).toBe("'@SUM()");
    });

    test('giữ nguyên chuỗi an toàn thông thường', () => {
      expect(chongCongThuc('Tiền trọ tháng 9')).toBe('Tiền trọ tháng 9');
      expect(chongCongThuc('Ăn uống sinh viên')).toBe('Ăn uống sinh viên');
      expect(chongCongThuc(12345)).toBe(12345);
    });
  });

  describe('thongKeTaiChinhService()', () => {
    test('tính toán chính xác tổng thu, tổng chi, số dư và phân loại danh mục', () => {
      const mockGiaoDichs = [
        { loai: 'thu', soTien: 3000000, danhMuc: 'tro_cap' },
        { loai: 'thu', soTien: 1500000, danhMuc: 'luong' },
        { loai: 'chi', soTien: 2000000, danhMuc: 'tro' },
        { loai: 'chi', soTien: 500000, danhMuc: 'an_uong' },
        { loai: 'chi', soTien: 300000, danhMuc: 'an_uong' },
      ];

      const ketQua = thongKeTaiChinhService(mockGiaoDichs);

      expect(ketQua.tongThu).toBe(4500000);
      expect(ketQua.tongChi).toBe(2800000);
      expect(ketQua.soDu).toBe(1700000);
      expect(ketQua.theoDanhMuc).toEqual({
        tro: 2000000,
        an_uong: 800000,
      });
    });
  });

  describe('kiemTraNganSachService()', () => {
    test('phát hiện đúng khi chi tiêu vượt ngân sách định mức', () => {
      const mockNganSachs = [
        { id: 1, danhMuc: 'an_uong', soTienToiDa: 1000000 },
        { id: 2, danhMuc: 'giai_tri', soTienToiDa: 500000 },
      ];

      const mockGiaoDichsChi = [
        { loai: 'chi', soTien: 1200000, danhMuc: 'an_uong' }, // Vượt 120%
        { loai: 'chi', soTien: 300000, danhMuc: 'giai_tri' },  // Còn lại 40%
      ];

      const ketQua = kiemTraNganSachService(mockNganSachs, mockGiaoDichsChi);

      const anUong = ketQua.find((k) => k.danhMuc === 'an_uong');
      expect(anUong.daChi).toBe(1200000);
      expect(anUong.phanTram).toBe(120);
      expect(anUong.vuotNganSach).toBe(true);

      const giaiTri = ketQua.find((k) => k.danhMuc === 'giai_tri');
      expect(giaiTri.daChi).toBe(300000);
      expect(giaiTri.conLai).toBe(200000);
      expect(giaiTri.phanTram).toBe(60);
      expect(giaiTri.vuotNganSach).toBe(false);
    });
  });
});
