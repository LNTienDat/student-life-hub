const prisma = require('../../prismaClient');
const ExcelJS = require('exceljs');

// ===== GIAO DỊCH =====

// Thêm giao dịch mới
async function themGiaoDich(req, res) {
  try {
    const { loai, danhMuc, soTien, moTa, ngayGiaoDich } = req.body;
    const idNguoiDung = req.user.id;

    if (!loai || !danhMuc || soTien === undefined) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ loại, danh mục, số tiền' });
    }

    const giaoDich = await prisma.giaoDich.create({
      data: {
        loai,
        danhMuc,
        soTien: parseFloat(soTien),
        moTa,
        ngayGiaoDich: ngayGiaoDich ? new Date(ngayGiaoDich) : undefined,
        idNguoiDung,
      },
    });

    res.status(201).json({ message: 'Thêm giao dịch thành công', giaoDich });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Lấy danh sách giao dịch (lọc theo tháng/năm, tìm kiếm, phân trang nếu có)
async function layDanhSachGiaoDich(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const { thang, nam, q, loai, danhMuc, trang, soLuong } = req.query;

    const where = { idNguoiDung };

    if (thang && nam) {
      const from = new Date(parseInt(nam), parseInt(thang) - 1, 1);
      const to = new Date(parseInt(nam), parseInt(thang), 1);
      where.ngayGiaoDich = { gte: from, lt: to };
    }

    if (loai) {
      where.loai = loai;
    }

    if (danhMuc) {
      where.danhMuc = danhMuc;
    }

    if (q) {
      where.OR = [
        { moTa: { contains: q, mode: 'insensitive' } },
        { danhMuc: { contains: q, mode: 'insensitive' } },
      ];
    }

    const trangSo = Math.max(parseInt(trang) || 1, 1);
    const kichThuoc = Math.max(parseInt(soLuong) || 20, 1);

    const [danhSach, tongSo] = await Promise.all([
      prisma.giaoDich.findMany({
        where,
        orderBy: { ngayGiaoDich: 'desc' },
        skip: (trangSo - 1) * kichThuoc,
        take: kichThuoc,
      }),
      prisma.giaoDich.count({ where }),
    ]);

    res.json({
      giaoDichs: danhSach,
      tongSo,
      trang: trangSo,
      soTrang: Math.max(Math.ceil(tongSo / kichThuoc), 1),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Sửa giao dịch
async function suaGiaoDich(req, res) {
  try {
    const { id } = req.params;
    const idNguoiDung = req.user.id;
    const { loai, danhMuc, soTien, moTa } = req.body;

    const ketQua = await prisma.giaoDich.updateMany({
      where: { id: parseInt(id), idNguoiDung },
      data: {
        loai,
        danhMuc,
        soTien: soTien !== undefined ? parseFloat(soTien) : undefined,
        moTa,
      },
    });

    if (ketQua.count === 0) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch hoặc bạn không có quyền sửa' });
    }

    const giaoDich = await prisma.giaoDich.findUnique({ where: { id: parseInt(id) } });
    res.json({ message: 'Cập nhật thành công', giaoDich });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Xóa giao dịch
async function xoaGiaoDich(req, res) {
  try {
    const { id } = req.params;
    const idNguoiDung = req.user.id;

    const ketQua = await prisma.giaoDich.deleteMany({ where: { id: parseInt(id), idNguoiDung } });

    if (ketQua.count === 0) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch hoặc bạn không có quyền xóa' });
    }
    res.json({ message: 'Xóa giao dịch thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Thống kê chi tiêu theo danh mục trong tháng
async function thongKeTheoThang(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const thang = parseInt(req.query.thang) || new Date().getMonth() + 1;
    const nam = parseInt(req.query.nam) || new Date().getFullYear();

    const from = new Date(nam, thang - 1, 1);
    const to = new Date(nam, thang, 1);

    const giaoDichs = await prisma.giaoDich.findMany({
      where: { idNguoiDung, ngayGiaoDich: { gte: from, lt: to } },
    });

    const tongThu = giaoDichs
      .filter((g) => g.loai === 'thu')
      .reduce((sum, g) => sum + g.soTien, 0);

    const tongChi = giaoDichs
      .filter((g) => g.loai === 'chi')
      .reduce((sum, g) => sum + g.soTien, 0);

    const theoDanhMuc = {};
    giaoDichs
      .filter((g) => g.loai === 'chi')
      .forEach((g) => {
        theoDanhMuc[g.danhMuc] = (theoDanhMuc[g.danhMuc] || 0) + g.soTien;
      });

    res.json({
      thang,
      nam,
      tongThu,
      tongChi,
      soDu: tongThu - tongChi,
      theoDanhMuc,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// ===== NGÂN SÁCH =====

// Đặt ngân sách cho 1 danh mục trong tháng
async function datNganSach(req, res) {
  try {
    const { danhMuc, soTienToiDa, thang, nam } = req.body;
    const idNguoiDung = req.user.id;

    if (!danhMuc || soTienToiDa === undefined || !thang || !nam) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin ngân sách' });
    }

    const nganSach = await prisma.nganSach.create({
      data: {
        danhMuc,
        soTienToiDa: parseFloat(soTienToiDa),
        thang: parseInt(thang),
        nam: parseInt(nam),
        idNguoiDung,
      },
    });

    res.status(201).json({ message: 'Đặt ngân sách thành công', nganSach });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Kiểm tra tình trạng ngân sách (so sánh với chi tiêu thực tế)
async function kiemTraNganSach(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const thang = parseInt(req.query.thang) || new Date().getMonth() + 1;
    const nam = parseInt(req.query.nam) || new Date().getFullYear();

    const nganSachs = await prisma.nganSach.findMany({
      where: { idNguoiDung, thang, nam },
    });

    const from = new Date(nam, thang - 1, 1);
    const to = new Date(nam, thang, 1);

    const giaoDichs = await prisma.giaoDich.findMany({
      where: { idNguoiDung, loai: 'chi', ngayGiaoDich: { gte: from, lt: to } },
    });

    const ketQua = nganSachs.map((ns) => {
      const daChi = giaoDichs
        .filter((g) => g.danhMuc === ns.danhMuc)
        .reduce((sum, g) => sum + g.soTien, 0);

      return {
        danhMuc: ns.danhMuc,
        soTienToiDa: ns.soTienToiDa,
        daChi,
        conLai: ns.soTienToiDa - daChi,
        vuotNganSach: daChi > ns.soTienToiDa,
      };
    });

    res.json({ thang, nam, ketQua });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Xu hướng thu/chi trong N tháng gần nhất
async function xuHuongNThang(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const soThang = parseInt(req.query.soThang) || 6;
    const now = new Date();

    const ketQua = [];
    for (let i = soThang - 1; i >= 0; i--) {
      const thoiDiem = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const thang = thoiDiem.getMonth() + 1;
      const nam = thoiDiem.getFullYear();
      const from = new Date(nam, thang - 1, 1);
      const to = new Date(nam, thang, 1);

      const giaoDichs = await prisma.giaoDich.findMany({
        where: { idNguoiDung, ngayGiaoDich: { gte: from, lt: to } },
      });

      const tongThu = giaoDichs.filter((g) => g.loai === 'thu').reduce((s, g) => s + g.soTien, 0);
      const tongChi = giaoDichs.filter((g) => g.loai === 'chi').reduce((s, g) => s + g.soTien, 0);

      ketQua.push({ thang: `${thang}/${nam}`, thu: tongThu, chi: tongChi });
    }

    res.json({ xuHuong: ketQua });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// CN37 - Xuất báo cáo tài chính ra file Excel (.xlsx)
// Query optional: ?thang=8&nam=2026 (không truyền thì xuất toàn bộ giao dịch)
async function xuatBaoCaoTaiChinhExcel(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const { thang, nam } = req.query;

    const where = { idNguoiDung };
    if (thang && nam) {
      const from = new Date(parseInt(nam), parseInt(thang) - 1, 1);
      const to = new Date(parseInt(nam), parseInt(thang), 1);
      where.ngayGiaoDich = { gte: from, lt: to };
    }

    const giaoDichs = await prisma.giaoDich.findMany({
      where,
      orderBy: { ngayGiaoDich: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Student Life Hub';
    workbook.created = new Date();

    // Sheet 1: Chi tiết giao dịch
    const sheet1 = workbook.addWorksheet('Chi tiết giao dịch');
    sheet1.columns = [
      { header: 'Ngày', key: 'ngay', width: 14 },
      { header: 'Loại', key: 'loai', width: 12 },
      { header: 'Danh mục', key: 'danhMuc', width: 20 },
      { header: 'Mô tả', key: 'moTa', width: 30 },
      { header: 'Số tiền', key: 'soTien', width: 16 },
    ];
    sheet1.getRow(1).font = { bold: true };

    let tongThu = 0;
    let tongChi = 0;
    giaoDichs.forEach((gd) => {
      sheet1.addRow({
        ngay: new Date(gd.ngayGiaoDich).toLocaleDateString('vi-VN'),
        loai: gd.loai === 'thu' ? 'Thu nhập' : 'Chi tiêu',
        danhMuc: gd.danhMuc,
        moTa: gd.moTa || '',
        soTien: gd.soTien,
      });
      if (gd.loai === 'thu') tongThu += gd.soTien;
      else if (gd.loai === 'chi') tongChi += gd.soTien;
    });
    sheet1.getColumn('soTien').numFmt = '#,##0" đ"';

    // Sheet 2: Tổng hợp theo danh mục
    const sheet2 = workbook.addWorksheet('Tổng hợp theo danh mục');
    sheet2.columns = [
      { header: 'Danh mục', key: 'danhMuc', width: 24 },
      { header: 'Loại', key: 'loai', width: 12 },
      { header: 'Tổng tiền', key: 'tong', width: 16 },
    ];
    sheet2.getRow(1).font = { bold: true };

    const theoDanhMuc = {};
    giaoDichs.forEach((gd) => {
      const key = `${gd.danhMuc}__${gd.loai}`;
      theoDanhMuc[key] = (theoDanhMuc[key] || 0) + gd.soTien;
    });
    Object.entries(theoDanhMuc).forEach(([key, tong]) => {
      const [danhMuc, loai] = key.split('__');
      sheet2.addRow({ danhMuc, loai: loai === 'thu' ? 'Thu nhập' : 'Chi tiêu', tong });
    });
    sheet2.getColumn('tong').numFmt = '#,##0" đ"';

    // Sheet 3: Tổng kết
    const sheet3 = workbook.addWorksheet('Tổng kết');
    sheet3.addRow(['Kỳ báo cáo', thang && nam ? `Tháng ${thang}/${nam}` : 'Toàn bộ']);
    sheet3.addRow(['Tổng thu', tongThu]);
    sheet3.addRow(['Tổng chi', tongChi]);
    sheet3.addRow(['Số dư', tongThu - tongChi]);
    sheet3.getColumn(1).width = 20;
    sheet3.getColumn(2).width = 20;
    sheet3.getColumn(2).numFmt = '#,##0" đ"';
    sheet3.getRow(1).font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    const tenFile = thang && nam ? `bao-cao-tai-chinh-${thang}-${nam}.xlsx` : 'bao-cao-tai-chinh.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename="${tenFile}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Không thể xuất báo cáo tài chính' });
  }
}

module.exports = {
  themGiaoDich,
  layDanhSachGiaoDich,
  suaGiaoDich,
  xoaGiaoDich,
  thongKeTheoThang,
  datNganSach,
  kiemTraNganSach,
  xuHuongNThang,
  xuatBaoCaoTaiChinhExcel,
};
