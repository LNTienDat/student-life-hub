const prisma = require('../../prismaClient');
const { THOIKHOABIEU } = require('../../constants');
const { finiteNumber } = require('../../utils/number.util');

// Kiểm tra thứ (2=Thứ 2 ... 8=Chủ nhật) và giờ kết thúc phải sau giờ bắt đầu.
function validateBuoiHoc({ tenMon, thu, gioBatDau, gioKetThuc, phongHoc, giangVien }) {
  if (tenMon !== undefined && (typeof tenMon !== 'string' || !tenMon.trim() || tenMon.length > THOIKHOABIEU.MAX_TEN_MON_LENGTH)) {
    return `Tên môn học cần có từ 1 đến ${THOIKHOABIEU.MAX_TEN_MON_LENGTH} ký tự`;
  }
  if (phongHoc != null && (typeof phongHoc !== 'string' || phongHoc.length > THOIKHOABIEU.MAX_PHONG_HOC_LENGTH)) {
    return `Phòng học không được vượt quá ${THOIKHOABIEU.MAX_PHONG_HOC_LENGTH} ký tự`;
  }
  if (giangVien != null && (typeof giangVien !== 'string' || giangVien.length > THOIKHOABIEU.MAX_GIANG_VIEN_LENGTH)) {
    return `Tên giảng viên không được vượt quá ${THOIKHOABIEU.MAX_GIANG_VIEN_LENGTH} ký tự`;
  }
  if (thu !== undefined) {
    const thuSo = finiteNumber(thu);
    if (!Number.isInteger(thuSo) || thuSo < THOIKHOABIEU.THU_MIN || thuSo > THOIKHOABIEU.THU_MAX) {
      return `Thứ không hợp lệ (chỉ nhận giá trị từ ${THOIKHOABIEU.THU_MIN} đến ${THOIKHOABIEU.THU_MAX})`;
    }
  }
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if ([gioBatDau, gioKetThuc].some((value) => value !== undefined && (typeof value !== 'string' || !timePattern.test(value)))) {
    return 'Giờ học phải đúng định dạng HH:mm (từ 00:00 đến 23:59)';
  }
  if (gioBatDau && gioKetThuc && gioKetThuc <= gioBatDau) {
    return 'Giờ kết thúc phải sau giờ bắt đầu';
  }
  return null;
}

// Thêm 1 buổi học vào thời khóa biểu
async function themBuoiHoc(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const { tenMon, thu, gioBatDau, gioKetThuc, phongHoc, giangVien, hocKy } = req.body;

    if (!tenMon || !thu || !gioBatDau || !gioKetThuc) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên môn, thứ, giờ bắt đầu/kết thúc' });
    }

    if (hocKy !== undefined && (typeof hocKy !== 'string' || hocKy.length > 100)) return res.status(400).json({ message: 'Học kỳ không hợp lệ.' });
    const loiValidate = validateBuoiHoc({ tenMon, thu, gioBatDau, gioKetThuc, phongHoc, giangVien });
    if (loiValidate) {
      return res.status(400).json({ message: loiValidate });
    }

    const buoiHoc = await prisma.thoiKhoaBieu.create({
      data: {
        idNguoiDung,
        tenMon,
        thu: finiteNumber(thu),
        gioBatDau,
        gioKetThuc,
        phongHoc,
        giangVien,
        hocKy,
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
      where: { idNguoiDung, ...(req.query.hocKy ? { OR: [{ hocKy: String(req.query.hocKy) }, { hocKy: '' }] } : {}) },
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
    const { tenMon, thu, gioBatDau, gioKetThuc, phongHoc, giangVien, hocKy } = req.body;

    if (hocKy !== undefined && (typeof hocKy !== 'string' || hocKy.length > 100)) return res.status(400).json({ message: 'Học kỳ không hợp lệ.' });
    const hienTai = await prisma.thoiKhoaBieu.findFirst({ where: { id: parseInt(id), idNguoiDung } });
    if (!hienTai) {
      return res.status(404).json({ message: 'Không tìm thấy buổi học hoặc bạn không có quyền sửa' });
    }
    const loiValidate = validateBuoiHoc({ ...hienTai, ...req.body });
    if (loiValidate) {
      return res.status(400).json({ message: loiValidate });
    }

    const ketQua = await prisma.thoiKhoaBieu.updateMany({
      where: { id: parseInt(id), idNguoiDung },
      data: {
        tenMon,
        thu: thu !== undefined ? finiteNumber(thu) : undefined,
        gioBatDau,
        gioKetThuc,
        phongHoc,
        giangVien,
        hocKy,
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
