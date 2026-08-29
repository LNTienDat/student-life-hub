const prisma = require('../../prismaClient');

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

// Lấy danh sách giao dịch (lọc theo tháng/năm nếu có)
async function layDanhSachGiaoDich(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const { thang, nam } = req.query;

    const where = { idNguoiDung };

    if (thang && nam) {
      const from = new Date(parseInt(nam), parseInt(thang) - 1, 1);
      const to = new Date(parseInt(nam), parseInt(thang), 1);
      where.ngayGiaoDich = { gte: from, lt: to };
    }

    const danhSach = await prisma.giaoDich.findMany({
      where,
      orderBy: { ngayGiaoDich: 'desc' },
    });

    res.json({ giaoDichs: danhSach });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Sửa giao dịch
async function suaGiaoDich(req, res) {
  try {
    const { id } = req.params;
    const { loai, danhMuc, soTien, moTa } = req.body;

    const giaoDich = await prisma.giaoDich.update({
      where: { id: parseInt(id) },
      data: {
        loai,
        danhMuc,
        soTien: soTien !== undefined ? parseFloat(soTien) : undefined,
        moTa,
      },
    });

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
    await prisma.giaoDich.delete({ where: { id: parseInt(id) } });
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

module.exports = {
  themGiaoDich,
  layDanhSachGiaoDich,
  suaGiaoDich,
  xoaGiaoDich,
  thongKeTheoThang,
  datNganSach,
  kiemTraNganSach,
  xuHuongNThang,
};
