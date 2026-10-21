const { serializable, httpError } = require('../../utils/transaction.util');
const { overlaps } = require('./conflicts');
const crypto = require('crypto');
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
    const { tenMon, thu, gioBatDau, gioKetThuc, phongHoc, giangVien, hocKy = '' } = req.body;
    if (!tenMon || !thu || !gioBatDau || !gioKetThuc || typeof hocKy !== 'string' || hocKy.length > 100) return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin buổi học hợp lệ' });
    const invalid = validateBuoiHoc(req.body);
    if (invalid) return res.status(400).json({ message: invalid });
    const data = { idNguoiDung: req.user.id, tenMon: tenMon.trim(), thu: finiteNumber(thu), gioBatDau, gioKetThuc, phongHoc, giangVien, hocKy: hocKy.trim() };
    const buoiHoc = await serializable(prisma, async tx => {
      const others = await tx.thoiKhoaBieu.findMany({ where: { idNguoiDung: req.user.id, thu: data.thu } });
      if (others.some(other => overlaps(data, other))) throw httpError(409, 'Buổi học bị trùng giờ với lịch đã có. Vui lòng kiểm tra lại.');
      return tx.thoiKhoaBieu.create({ data });
    });
    res.status(201).json({ message: 'Thêm buổi học thành công', buoiHoc });
  } catch (error) { res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Chưa lưu được lịch học. Vui lòng thử lại.' }); }
}

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
    const id = Number(req.params.id);
    const input = Object.fromEntries(['tenMon', 'thu', 'gioBatDau', 'gioKetThuc', 'phongHoc', 'giangVien', 'hocKy'].filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
    if (!Object.keys(input).length || (input.hocKy !== undefined && (typeof input.hocKy !== 'string' || input.hocKy.length > 100))) return res.status(400).json({ message: 'Thông tin cập nhật không hợp lệ' });
    const buoiHoc = await serializable(prisma, async tx => {
      const current = await tx.thoiKhoaBieu.findFirst({ where: { id, idNguoiDung: req.user.id } });
      if (!current) throw httpError(404, 'Không tìm thấy buổi học hoặc bạn không có quyền sửa');
      const data = { ...current, ...input };
      const invalid = validateBuoiHoc(data);
      if (invalid) throw httpError(400, invalid);
      data.thu = finiteNumber(data.thu);
      const others = await tx.thoiKhoaBieu.findMany({ where: { idNguoiDung: req.user.id, thu: data.thu, id: { not: id } } });
      if (others.some(other => overlaps(data, other))) throw httpError(409, 'Buổi học bị trùng giờ với lịch đã có.');
      if (input.thu !== undefined) input.thu = finiteNumber(input.thu);
      if (input.tenMon !== undefined) input.tenMon = input.tenMon.trim();
      if (input.hocKy !== undefined) input.hocKy = input.hocKy.trim();
      await tx.thoiKhoaBieu.updateMany({ where: { id, idNguoiDung: req.user.id }, data: input });
      return tx.thoiKhoaBieu.findUnique({ where: { id } });
    });
    res.json({ message: 'Cập nhật thành công', buoiHoc });
  } catch (error) { res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Chưa lưu được lịch học. Vui lòng thử lại.' }); }
}

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

// Bật / tạo link chia sẻ công khai thời khóa biểu
async function batChiaSeTKB(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const nguoiDung = await prisma.nguoiDung.findUnique({
      where: { id: idNguoiDung },
      select: { shareToken: true, shareEnabled: true },
    });

    let token = nguoiDung ? nguoiDung.shareToken : null;
    if (!token || !nguoiDung.shareEnabled) {
      token = crypto.randomUUID();
    }

    const updated = await prisma.nguoiDung.update({
      where: { id: idNguoiDung },
      data: {
        shareToken: token,
        shareEnabled: true,
      },
      select: { shareToken: true, shareEnabled: true },
    });

    res.json({
      message: 'Đã bật chia sẻ thời khóa biểu',
      shareToken: updated.shareToken,
      shareEnabled: updated.shareEnabled,
    });
  } catch (error) {
    console.error('Lỗi bật chia sẻ TKB:', error);
    res.status(500).json({ message: 'Lỗi server khi bật chia sẻ' });
  }
}

// Tắt chia sẻ công khai thời khóa biểu
async function tatChiaSeTKB(req, res) {
  try {
    const idNguoiDung = req.user.id;
    await prisma.nguoiDung.update({
      where: { id: idNguoiDung },
      data: { shareEnabled: false },
    });

    res.json({ message: 'Đã tắt chia sẻ thời khóa biểu', shareEnabled: false });
  } catch (error) {
    console.error('Lỗi tắt chia sẻ TKB:', error);
    res.status(500).json({ message: 'Lỗi server khi tắt chia sẻ' });
  }
}

// Lấy trạng thái chia sẻ hiện tại của user
async function layTrangThaiChiaSe(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const nguoiDung = await prisma.nguoiDung.findUnique({
      where: { id: idNguoiDung },
      select: { shareToken: true, shareEnabled: true },
    });

    res.json({
      shareToken: nguoiDung ? nguoiDung.shareToken : null,
      shareEnabled: Boolean(nguoiDung && nguoiDung.shareEnabled),
    });
  } catch (error) {
    console.error('Lỗi lấy trạng thái chia sẻ:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// PUBLIC: Xem thời khóa biểu qua link chia sẻ (không cần đăng nhập)
async function xemTKBChiaSe(req, res) {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: 'Thiếu mã token chia sẻ' });
    }

    const nguoiDung = await prisma.nguoiDung.findUnique({
      where: { shareToken: token },
      select: {
        id: true,
        ten: true,
        truong: true,
        nganh: true,
        khoaHoc: true,
        shareEnabled: true,
      },
    });

    if (!nguoiDung || !nguoiDung.shareEnabled) {
      return res.status(404).json({ message: 'Thời khóa biểu này không tồn tại hoặc đã tắt chia sẻ công khai' });
    }

    const thoiKhoaBieu = await prisma.thoiKhoaBieu.findMany({
      where: { idNguoiDung: nguoiDung.id },
      orderBy: [{ thu: 'asc' }, { gioBatDau: 'asc' }],
    });

    res.json({
      chuSoHuu: {
        ten: nguoiDung.ten,
        truong: nguoiDung.truong,
        nganh: nguoiDung.nganh,
        khoaHoc: nguoiDung.khoaHoc,
      },
      thoiKhoaBieu,
    });
  } catch (error) {
    console.error('Lỗi xem TKB chia sẻ:', error);
    res.status(500).json({ message: 'Lỗi server khi tải thời khóa biểu' });
  }
}

module.exports = {
  themBuoiHoc,
  layThoiKhoaBieu,
  suaBuoiHoc,
  xoaBuoiHoc,
  batChiaSeTKB,
  tatChiaSeTKB,
  layTrangThaiChiaSe,
  xemTKBChiaSe,
};
