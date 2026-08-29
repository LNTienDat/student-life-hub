const prisma = require('../../prismaClient');

// Thêm deadline mới
async function themDeadline(req, res) {
  try {
    const { tieuDe, moTa, hanChot, idMonHoc, doUuTien } = req.body;
    const idNguoiDung = req.user.id;

    if (!tieuDe || !hanChot) {
      return res.status(400).json({ message: 'Vui lòng nhập tiêu đề và hạn chót' });
    }

    const deadline = await prisma.deadline.create({
      data: {
        tieuDe,
        moTa,
        hanChot: new Date(hanChot),
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
    const { tieuDe, moTa, hanChot, doUuTien, trangThai } = req.body;

    const deadline = await prisma.deadline.update({
      where: { id: parseInt(id) },
      data: {
        tieuDe,
        moTa,
        hanChot: hanChot ? new Date(hanChot) : undefined,
        doUuTien,
        trangThai,
      },
    });

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

    const deadline = await prisma.deadline.update({
      where: { id: parseInt(id) },
      data: { trangThai: 'hoan_thanh' },
    });

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
    await prisma.deadline.delete({ where: { id: parseInt(id) } });
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
