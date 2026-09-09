const prisma = require('../../prismaClient');

// Thêm deadline mới
async function themDeadline(req, res) {
  try {
    const { tieuDe, moTa, hanChot, idMonHoc, doUuTien } = req.body;
    const idNguoiDung = req.user.id;

    if (!tieuDe || !hanChot) {
      return res.status(400).json({ message: 'Vui lòng nhập tiêu đề và hạn chót' });
    }
    const hanChotDate = new Date(hanChot);
    if (isNaN(hanChotDate.getTime())) {
      return res.status(400).json({ message: 'Hạn chót không hợp lệ' });
    }
    if (doUuTien && !['thap', 'binh_thuong', 'cao'].includes(doUuTien)) {
      return res.status(400).json({ message: 'Độ ưu tiên không hợp lệ' });
    }

    // Nếu có gắn môn học, kiểm tra môn đó phải thuộc về đúng người dùng —
    // tránh gắn deadline vào môn học của người khác.
    if (idMonHoc) {
      const monHoc = await prisma.monHoc.findFirst({
        where: { id: parseInt(idMonHoc), idNguoiDung },
      });
      if (!monHoc) {
        return res.status(404).json({ message: 'Không tìm thấy môn học hoặc bạn không có quyền gắn deadline vào môn này' });
      }
    }

    const deadline = await prisma.deadline.create({
      data: {
        tieuDe,
        moTa,
        hanChot: hanChotDate,
        idMonHoc: idMonHoc ? parseInt(idMonHoc) : null,
        doUuTien: doUuTien || 'binh_thuong',
        idNguoiDung,
      },
    });

    res.status(201).json({ message: 'Thêm deadline thành công', deadline });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Lấy danh sách deadline của user (có thể lọc theo trạng thái)
async function layDanhSachDeadline(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const { trangThai } = req.query;

    const where = { idNguoiDung };
    if (trangThai) where.trangThai = trangThai;

    const danhSach = await prisma.deadline.findMany({
      where,
      include: { monHoc: true },
      orderBy: { hanChot: 'asc' },
    });

    res.json({ deadlines: danhSach });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Sửa deadline
async function suaDeadline(req, res) {
  try {
    const { id } = req.params;
    const idNguoiDung = req.user.id;
    const { tieuDe, moTa, hanChot, doUuTien, trangThai } = req.body;

    if (hanChot && isNaN(new Date(hanChot).getTime())) {
      return res.status(400).json({ message: 'Hạn chót không hợp lệ' });
    }
    if (doUuTien && !['thap', 'binh_thuong', 'cao'].includes(doUuTien)) {
      return res.status(400).json({ message: 'Độ ưu tiên không hợp lệ' });
    }
    if (trangThai && !['dang_dien_hanh', 'hoan_thanh', 'cho_xu_ly'].includes(trangThai)) {
      return res.status(400).json({ message: 'Trạng thái deadline không hợp lệ' });
    }

    const ketQua = await prisma.deadline.updateMany({
      where: { id: parseInt(id), idNguoiDung },
      data: {
        tieuDe,
        moTa,
        hanChot: hanChot ? new Date(hanChot) : undefined,
        doUuTien,
        trangThai,
      },
    });

    if (ketQua.count === 0) {
      return res.status(404).json({ message: 'Không tìm thấy deadline hoặc bạn không có quyền sửa' });
    }

    const deadline = await prisma.deadline.findUnique({ where: { id: parseInt(id) } });
    res.json({ message: 'Cập nhật thành công', deadline });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Đánh dấu deadline đã hoàn thành
async function hoanThanhDeadline(req, res) {
  try {
    const { id } = req.params;
    const idNguoiDung = req.user.id;

    const ketQua = await prisma.deadline.updateMany({
      where: { id: parseInt(id), idNguoiDung },
      data: { trangThai: 'hoan_thanh' },
    });

    if (ketQua.count === 0) {
      return res.status(404).json({ message: 'Không tìm thấy deadline hoặc bạn không có quyền cập nhật' });
    }

    const deadline = await prisma.deadline.findUnique({ where: { id: parseInt(id) } });
    res.json({ message: 'Đã đánh dấu hoàn thành', deadline });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Xóa deadline
async function xoaDeadline(req, res) {
  try {
    const { id } = req.params;
    const idNguoiDung = req.user.id;

    const ketQua = await prisma.deadline.deleteMany({ where: { id: parseInt(id), idNguoiDung } });

    if (ketQua.count === 0) {
      return res.status(404).json({ message: 'Không tìm thấy deadline hoặc bạn không có quyền xóa' });
    }
    res.json({ message: 'Xóa deadline thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Lấy deadline sắp tới (trong vòng N ngày)
async function deadlineSapToi(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const soNgay = req.query.soNgay ? parseInt(req.query.soNgay) : 7;

    const now = new Date();
    const gioiHan = new Date();
    gioiHan.setDate(now.getDate() + soNgay);

    const danhSach = await prisma.deadline.findMany({
      where: {
        idNguoiDung,
        trangThai: 'dang_dien_hanh',
        hanChot: { gte: now, lte: gioiHan },
      },
      include: { monHoc: true },
      orderBy: { hanChot: 'asc' },
    });

    res.json({ soNgay, deadlines: danhSach });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

module.exports = {
  themDeadline,
  layDanhSachDeadline,
  suaDeadline,
  hoanThanhDeadline,
  xoaDeadline,
  deadlineSapToi,
};
