const prisma = require('../../prismaClient');
const ExcelJS = require('exceljs');
const { FINANCE } = require('../../constants');
const { finiteNumber } = require('../../utils/number.util');
const {
  chongCongThuc,
  thongKeTaiChinhService,
  kiemTraNganSachService,
} = require('./finance.service');

const { DANH_MUC_CHI, DANH_MUC_THU, DANH_MUC_HOP_LE } = FINANCE;

// ===== GIAO DỊCH =====

// Thêm giao dịch mới
async function themGiaoDich(req, res) {
  try {
    const { loai, danhMuc, soTien, moTa, ngayGiaoDich } = req.body;
    const idNguoiDung = req.user.id;

    if (!loai || !danhMuc || soTien === undefined) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ loại, danh mục, số tiền' });
    }
    if (!['thu', 'chi'].includes(loai)) {
      return res.status(400).json({ message: 'Loại giao dịch không hợp lệ (chỉ nhận "thu" hoặc "chi")' });
    }
    if (loai === 'chi' && !DANH_MUC_CHI.includes(danhMuc)) {
      return res.status(400).json({ message: 'Danh mục chi tiêu không hợp lệ' });
    }
    if (loai === 'thu' && !DANH_MUC_THU.includes(danhMuc) && !DANH_MUC_CHI.includes(danhMuc)) {
      return res.status(400).json({ message: 'Danh mục thu nhập không hợp lệ' });
    }
    if (!Number.isFinite(finiteNumber(soTien)) || finiteNumber(soTien) <= 0) {
      return res.status(400).json({ message: 'Số tiền phải là số dương' });
    }
    if (ngayGiaoDich && isNaN(new Date(ngayGiaoDich).getTime())) {
      return res.status(400).json({ message: 'Ngày giao dịch không hợp lệ' });
    }

    const giaoDich = await prisma.giaoDich.create({
      data: {
        loai,
        danhMuc,
        soTien: finiteNumber(soTien),
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
    const kichThuoc = Math.min(Math.max(parseInt(soLuong) || FINANCE.DEFAULT_PAGE_SIZE, 1), FINANCE.MAX_PAGE_SIZE);

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
    const { loai, danhMuc, soTien, moTa, ngayGiaoDich } = req.body;

    if (loai !== undefined && !['thu', 'chi'].includes(loai)) {
      return res.status(400).json({ message: 'Loại giao dịch không hợp lệ (chỉ nhận "thu" hoặc "chi")' });
    }
    if (danhMuc !== undefined && !DANH_MUC_HOP_LE.includes(danhMuc)) {
      return res.status(400).json({ message: 'Danh mục không hợp lệ' });
    }
    if (soTien !== undefined && (!Number.isFinite(finiteNumber(soTien)) || finiteNumber(soTien) <= 0)) {
      return res.status(400).json({ message: 'Số tiền phải là số dương' });
    }
    if (ngayGiaoDich !== undefined && (typeof ngayGiaoDich !== 'string' || !ngayGiaoDich.trim() || isNaN(new Date(ngayGiaoDich).getTime()))) {
      return res.status(400).json({ message: 'Ngày giao dịch không hợp lệ' });
    }

    const hienTai = await prisma.giaoDich.findFirst({ where: { id: parseInt(id), idNguoiDung } });
    if (!hienTai) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch hoặc bạn không có quyền sửa' });
    }
    const loaiMoi = loai ?? hienTai.loai;
    const danhMucMoi = danhMuc ?? hienTai.danhMuc;
    if (loaiMoi === 'chi' && !DANH_MUC_CHI.includes(danhMucMoi)) {
      return res.status(400).json({ message: 'Vui lòng chọn danh mục chi tiêu phù hợp' });
    }

    const ketQua = await prisma.giaoDich.updateMany({
      where: { id: parseInt(id), idNguoiDung },
      data: {
        loai,
        danhMuc,
        soTien: soTien !== undefined ? finiteNumber(soTien) : undefined,
        moTa,
        ngayGiaoDich: ngayGiaoDich !== undefined ? new Date(ngayGiaoDich) : undefined,
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

    const { tongThu, tongChi, soDu, theoDanhMuc } = thongKeTaiChinhService(giaoDichs);

    res.json({
      thang,
      nam,
      tongThu,
      tongChi,
      soDu,
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
    if (!DANH_MUC_CHI.includes(danhMuc)) {
      return res.status(400).json({ message: 'Danh mục ngân sách không hợp lệ (ngân sách chỉ áp dụng cho chi tiêu)' });
    }
    if (!Number.isFinite(finiteNumber(soTienToiDa)) || finiteNumber(soTienToiDa) <= 0) {
      return res.status(400).json({ message: 'Hạn mức ngân sách phải là số dương' });
    }
    if (!Number.isInteger(finiteNumber(thang)) || finiteNumber(thang) < 1 || finiteNumber(thang) > 12) {
      return res.status(400).json({ message: 'Tháng không hợp lệ (phải từ 1 đến 12)' });
    }
    if (!Number.isInteger(finiteNumber(nam)) || finiteNumber(nam) < 1000 || finiteNumber(nam) > 9999) {
      return res.status(400).json({ message: 'Năm phải là số nguyên từ 1000 đến 9999' });
    }

    const amount = finiteNumber(soTienToiDa);
    const month = finiteNumber(thang);
    const year = finiteNumber(nam);
    const nganSach = await prisma.nganSach.upsert({
      where: { idNguoiDung_danhMuc_thang_nam: { idNguoiDung, danhMuc, thang: month, nam: year } },
      create: { danhMuc, soTienToiDa: amount, thang: month, nam: year, idNguoiDung },
      update: { soTienToiDa: amount },
    });
    res.status(200).json({ message: 'Đã lưu ngân sách', nganSach });
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

    const ketQua = kiemTraNganSachService(nganSachs, giaoDichs);

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
    // Giới hạn soThang trong khoảng [1, 24]
    const soThang = Math.min(Math.max(parseInt(req.query.soThang) || FINANCE.DEFAULT_TREND_MONTHS, 1), 24);
    const now = new Date();

    // Tính khoảng thời gian bao phủ toàn bộ N tháng
    const from = new Date(now.getFullYear(), now.getMonth() - (soThang - 1), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 1 query duy nhất thay vì N queries tuần tự
    const giaoDichs = await prisma.giaoDich.findMany({
      where: { idNguoiDung, ngayGiaoDich: { gte: from, lt: to } },
      select: { loai: true, soTien: true, ngayGiaoDich: true },
    });

    // Tạo map kết quả khởi tạo sẵn cho tất cả N tháng
    const thangMap = {};
    for (let i = soThang - 1; i >= 0; i--) {
      const thoiDiem = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const thang = thoiDiem.getMonth() + 1;
      const nam = thoiDiem.getFullYear();
      thangMap[`${thang}/${nam}`] = { thang: `${thang}/${nam}`, thu: 0, chi: 0 };
    }

    // Gom nhóm trong bộ nhớ
    giaoDichs.forEach((g) => {
      const d = new Date(g.ngayGiaoDich);
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      if (thangMap[key]) {
        if (g.loai === 'thu') thangMap[key].thu += g.soTien;
        else thangMap[key].chi += g.soTien;
      }
    });

    res.json({ xuHuong: Object.values(thangMap) });
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
      // Giới hạn an toàn tải dữ liệu vào bộ nhớ khi xuất file
      take: FINANCE.MAX_EXPORT_RECORDS,
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
        danhMuc: chongCongThuc(gd.danhMuc),
        moTa: chongCongThuc(gd.moTa || ''),
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
      sheet2.addRow({ danhMuc: chongCongThuc(danhMuc), loai: loai === 'thu' ? 'Thu nhập' : 'Chi tiêu', tong });
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
