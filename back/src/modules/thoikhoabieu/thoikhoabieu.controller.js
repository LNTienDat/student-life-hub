const prisma = require('../../prismaClient');

// Thêm 1 buổi học vào thời khóa biểu
async function themBuoiHoc(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const { tenMon, thu, gioBatDau, gioKetThuc, phongHoc, giangVien } = req.body;

    if (!tenMon || !thu || !gioBatDau || !gioKetThuc) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên môn, thứ, giờ bắt đầu/kết thúc' });
    }

    const buoiHoc = await prisma.thoiKhoaBieu.create({
      data: {
        idNguoiDung,
        tenMon,
        thu: parseInt(thu),
        gioBatDau,
        gioKetThuc,
        phongHoc,
        giangVien,
      },
    });

    res.status(201).json({ message: 'Thêm buổi học thành công', buoiHoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Lấy toàn bộ thời khóa biểu của người dùng, sắp xếp theo thứ rồi giờ
async function layThoiKhoaBieu(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const danhSach = await prisma.thoiKhoaBieu.findMany({
      where: { idNguoiDung },
      orderBy: [{ thu: 'asc' }, { gioBatDau: 'asc' }],
    });
    res.json({ thoiKhoaBieu: danhSach });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Sửa 1 buổi học
async function suaBuoiHoc(req, res) {
  try {
    const { id } = req.params;
    const idNguoiDung = req.user.id;
    const { tenMon, thu, gioBatDau, gioKetThuc, phongHoc, giangVien } = req.body;

    const ketQua = await prisma.thoiKhoaBieu.updateMany({
      where: { id: parseInt(id), idNguoiDung },
      data: {
        tenMon,
        thu: thu !== undefined ? parseInt(thu) : undefined,
        gioBatDau,
        gioKetThuc,
        phongHoc,
        giangVien,
      },
    });

    if (ketQua.count === 0) {
      return res.status(404).json({ message: 'Không tìm thấy buổi học hoặc bạn không có quyền sửa' });
    }

    const buoiHoc = await prisma.thoiKhoaBieu.findUnique({ where: { id: parseInt(id) } });
    res.json({ message: 'Cập nhật thành công', buoiHoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Xóa 1 buổi học
async function xoaBuoiHoc(req, res) {
  try {
    const { id } = req.params;
    const idNguoiDung = req.user.id;

    const ketQua = await prisma.thoiKhoaBieu.deleteMany({ where: { id: parseInt(id), idNguoiDung } });

    if (ketQua.count === 0) {
      return res.status(404).json({ message: 'Không tìm thấy buổi học hoặc bạn không có quyền xóa' });
    }
    res.json({ message: 'Xóa buổi học thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

module.exports = { themBuoiHoc, layThoiKhoaBieu, suaBuoiHoc, xoaBuoiHoc };
