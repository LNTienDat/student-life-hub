const { validText } = require('../../utils/validation.util');
const { parseVietnamDate } = require('../../utils/date.util');
const crypto = require('crypto');
const prisma = require('../../prismaClient');
const { NHOM } = require('../../constants');

// Hàm tạo mã nhóm ngẫu nhiên 6 ký tự viết hoa dễ đọc (bỏ các ký tự dễ nhầm lẫn như 0, O, 1, I)
function taoMaNhom() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < NHOM.CODE_LENGTH; i++) {
    const randIndex = crypto.randomInt(0, chars.length);
    result += chars[randIndex];
  }
  return result;
}

// 1. Tạo nhóm học tập mới
async function taoNhom(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const { ten, moTa } = req.body;
    if (moTa != null && !validText(moTa, NHOM.MAX_MO_TA_LENGTH, false)) return res.status(400).json({ message: 'Mô tả nhóm không hợp lệ' });

    if (!validText(ten, NHOM.MAX_TEN_LENGTH)) {
      return res.status(400).json({ message: 'Tên nhóm không được để trống' });
    }
    if (ten.trim().length > NHOM.MAX_TEN_LENGTH) {
      return res.status(400).json({ message: `Tên nhóm không được quá ${NHOM.MAX_TEN_LENGTH} ký tự` });
    }
    if (moTa != null && !validText(moTa, NHOM.MAX_MO_TA_LENGTH, false)) {
      return res.status(400).json({ message: `Mô tả không được quá ${NHOM.MAX_MO_TA_LENGTH} ký tự` });
    }

    // Sinh mã code duy nhất (thử tối đa 5 lần)
    let maCode = taoMaNhom();
    let daCo = await prisma.nhomHocTap.findUnique({ where: { maCode } });
    let retry = 0;
    while (daCo && retry < 5) {
      maCode = taoMaNhom();
      daCo = await prisma.nhomHocTap.findUnique({ where: { maCode } });
      retry++;
    }

    const nhomMoi = await prisma.nhomHocTap.create({
      data: {
        ten: ten.trim(),
        moTa: moTa ? moTa.trim() : null,
        maCode,
        idChuNhom: idNguoiDung,
        thanhViens: {
          create: {
            idNguoiDung,
            vaiTro: NHOM.VAI_TRO.CHU_NHOM,
          },
        },
      },
      include: {
        chuNhom: {
          select: { id: true, ten: true, email: true, avatar: true },
        },
        thanhViens: {
          include: {
            nguoiDung: {
              select: { id: true, ten: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    res.status(201).json({ message: 'Tạo nhóm học tập thành công', nhom: nhomMoi });
  } catch (error) {
    console.error('Lỗi tạo nhóm:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo nhóm' });
  }
}

// 2. Tham gia nhóm bằng mã mời (maCode)
async function thamGiaNhom(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const { maCode } = req.body;

    if (!validText(maCode, 20)) {
      return res.status(400).json({ message: 'Vui lòng nhập mã mời của nhóm' });
    }

    const nhom = await prisma.nhomHocTap.findUnique({
      where: { maCode: maCode.trim().toUpperCase() },
      include: {
        thanhViens: true,
      },
    });

    if (!nhom) {
      return res.status(404).json({ message: 'Không tìm thấy nhóm với mã mời này' });
    }

    const daThamGia = nhom.thanhViens.some((tv) => tv.idNguoiDung === idNguoiDung);
    if (daThamGia) {
      return res.status(400).json({ message: 'Bạn đã là thành viên của nhóm này rồi' });
    }

    if (nhom.thanhViens.length >= NHOM.MAX_MEMBERS_PER_GROUP) {
      return res.status(400).json({ message: `Nhóm đã đạt số lượng tối đa (${NHOM.MAX_MEMBERS_PER_GROUP} thành viên)` });
    }

    await prisma.thanhVienNhom.create({
      data: {
        idNhom: nhom.id,
        idNguoiDung,
        vaiTro: NHOM.VAI_TRO.THANH_VIEN,
      },
    });

    res.status(200).json({ message: `Đã tham gia nhóm "${nhom.ten}" thành công!`, nhomId: nhom.id });
  } catch (error) {
    console.error('Lỗi tham gia nhóm:', error);
    res.status(500).json({ message: 'Lỗi server khi tham gia nhóm' });
  }
}

// 3. Lấy danh sách nhóm của user hiện tại
async function layDanhSachNhom(req, res) {
  try {
    const idNguoiDung = req.user.id;

    const thanhVienRecords = await prisma.thanhVienNhom.findMany({
      where: { idNguoiDung },
      include: {
        nhom: {
          include: {
            chuNhom: {
              select: { id: true, ten: true, email: true },
            },
            thanhViens: {
              include: {
                nguoiDung: {
                  select: { id: true, ten: true, email: true, avatar: true },
                },
              },
            },
            _count: {
              select: {
                thanhViens: true,
                deadlineNhoms: true,
              },
            },
          },
        },
      },
      orderBy: { ngayThamGia: 'desc' },
    });

    const nhoms = thanhVienRecords.map((tv) => ({
      ...tv.nhom,
      vaiTroCuaBan: tv.vaiTro,
    }));

    res.json({ nhoms });
  } catch (error) {
    console.error('Lỗi lấy danh sách nhóm:', error);
    res.status(500).json({ message: 'Lỗi server khi tải danh sách nhóm' });
  }
}

// 4. Chi tiết 1 nhóm (gồm thành viên + deadline nhóm + tiến độ từng người)
async function layChiTietNhom(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const idNhom = parseInt(req.params.id);

    if (isNaN(idNhom)) {
      return res.status(400).json({ message: 'ID nhóm không hợp lệ' });
    }

    // Kiểm tra quyền thành viên
    const thanhVien = await prisma.thanhVienNhom.findUnique({
      where: {
        idNhom_idNguoiDung: {
          idNhom,
          idNguoiDung,
        },
      },
    });

    if (!thanhVien) {
      return res.status(403).json({ message: 'Bạn không có quyền xem thông tin nhóm này' });
    }

    const nhom = await prisma.nhomHocTap.findUnique({
      where: { id: idNhom },
      include: {
        chuNhom: {
          select: { id: true, ten: true, email: true, avatar: true },
        },
        thanhViens: {
          include: {
            nguoiDung: {
              select: { id: true, ten: true, email: true, avatar: true },
            },
          },
          orderBy: { ngayThamGia: 'asc' },
        },
        deadlineNhoms: {
          include: {
            nguoiTao: {
              select: { id: true, ten: true, email: true },
            },
            tienDos: {
              where: { nguoiDung: { nhomThamGia: { some: { idNhom } } } },
              include: {
                nguoiDung: {
                  select: { id: true, ten: true, email: true, avatar: true },
                },
              },
            },
          },
          orderBy: { hanChot: 'asc' },
        },
      },
    });

    if (!nhom) {
      return res.status(404).json({ message: 'Không tìm thấy nhóm' });
    }

    res.json({ nhom, vaiTroCuaBan: thanhVien.vaiTro });
  } catch (error) {
    console.error('Lỗi lấy chi tiết nhóm:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết nhóm' });
  }
}

// 5. Cập nhật thông tin nhóm (chỉ chủ nhóm)
async function suaNhom(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const idNhom = parseInt(req.params.id);
    const { ten, moTa } = req.body;
    if (moTa != null && !validText(moTa, NHOM.MAX_MO_TA_LENGTH, false)) return res.status(400).json({ message: 'Mô tả nhóm không hợp lệ' });

    if (isNaN(idNhom)) return res.status(400).json({ message: 'ID nhóm không hợp lệ' });

    const nhom = await prisma.nhomHocTap.findUnique({ where: { id: idNhom } });
    if (!nhom) return res.status(404).json({ message: 'Không tìm thấy nhóm' });

    if (nhom.idChuNhom !== idNguoiDung) {
      return res.status(403).json({ message: 'Chỉ chủ nhóm mới có quyền sửa thông tin nhóm' });
    }

    if (ten !== undefined && !validText(ten, NHOM.MAX_TEN_LENGTH)) {
      return res.status(400).json({ message: 'Tên nhóm không được để trống' });
    }

    const capNhat = await prisma.nhomHocTap.update({
      where: { id: idNhom },
      data: {
        ten: ten ? ten.trim() : undefined,
        moTa: moTa !== undefined ? (moTa ? moTa.trim() : null) : undefined,
      },
    });

    res.json({ message: 'Cập nhật nhóm thành công', nhom: capNhat });
  } catch (error) {
    console.error('Lỗi sửa nhóm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// 6. Xóa nhóm (chỉ chủ nhóm)
async function xoaNhom(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const idNhom = parseInt(req.params.id);

    if (isNaN(idNhom)) return res.status(400).json({ message: 'ID nhóm không hợp lệ' });

    const nhom = await prisma.nhomHocTap.findUnique({ where: { id: idNhom } });
    if (!nhom) return res.status(404).json({ message: 'Không tìm thấy nhóm' });

    if (nhom.idChuNhom !== idNguoiDung) {
      return res.status(403).json({ message: 'Chỉ chủ nhóm mới có quyền giải tán nhóm' });
    }

    await prisma.nhomHocTap.delete({ where: { id: idNhom } });

    res.json({ message: 'Đã giải tán nhóm thành công' });
  } catch (error) {
    console.error('Lỗi xóa nhóm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// 7. Rời nhóm (thành viên tự rời)
async function roiNhom(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const idNhom = parseInt(req.params.id);

    if (isNaN(idNhom)) return res.status(400).json({ message: 'ID nhóm không hợp lệ' });

    const nhom = await prisma.nhomHocTap.findUnique({ where: { id: idNhom } });
    if (!nhom) return res.status(404).json({ message: 'Không tìm thấy nhóm' });

    if (nhom.idChuNhom === idNguoiDung) {
      return res.status(400).json({ message: 'Chủ nhóm không thể rời nhóm. Hãy chỉ định chủ nhóm mới hoặc giải tán nhóm.' });
    }

    const ketQua = await prisma.thanhVienNhom.deleteMany({
      where: {
        idNhom,
        idNguoiDung,
      },
    });

    if (ketQua.count === 0) {
      return res.status(400).json({ message: 'Bạn không phải là thành viên nhóm này' });
    }

    res.json({ message: 'Bạn đã rời nhóm thành công' });
  } catch (error) {
    console.error('Lỗi rời nhóm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// 8. Đuổi thành viên (chỉ chủ nhóm)
async function kickThanhVien(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const idNhom = parseInt(req.params.id);
    const idThanhVien = parseInt(req.params.idThanhVien);

    if (isNaN(idNhom) || isNaN(idThanhVien)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const nhom = await prisma.nhomHocTap.findUnique({ where: { id: idNhom } });
    if (!nhom) return res.status(404).json({ message: 'Không tìm thấy nhóm' });

    if (nhom.idChuNhom !== idNguoiDung) {
      return res.status(403).json({ message: 'Chỉ chủ nhóm mới có quyền xóa thành viên' });
    }

    if (idThanhVien === idNguoiDung) {
      return res.status(400).json({ message: 'Chủ nhóm không thể tự đuổi chính mình' });
    }

    await prisma.thanhVienNhom.deleteMany({
      where: {
        idNhom,
        idNguoiDung: idThanhVien,
      },
    });

    res.json({ message: 'Đã xóa thành viên khỏi nhóm' });
  } catch (error) {
    console.error('Lỗi đuổi thành viên:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// 9. Tạo deadline nhóm mới
async function themDeadlineNhom(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const idNhom = parseInt(req.params.id);
    const { tieuDe, moTa, hanChot, doUuTien } = req.body;
    if ((tieuDe !== undefined && !validText(tieuDe, 200)) || (moTa != null && !validText(moTa, 5000, false)) || (doUuTien !== undefined && !['thap', 'binh_thuong', 'cao'].includes(doUuTien))) return res.status(400).json({ message: 'Thông tin deadline không hợp lệ' });

    if (isNaN(idNhom)) return res.status(400).json({ message: 'ID nhóm không hợp lệ' });

    if (!validText(tieuDe, 200) || !hanChot) {
      return res.status(400).json({ message: 'Vui lòng nhập tiêu đề và hạn chót cho deadline' });
    }

    const hanChotDate = parseVietnamDate(hanChot);
    if (isNaN(hanChotDate.getTime())) {
      return res.status(400).json({ message: 'Hạn chót không hợp lệ' });
    }

    // Kiểm tra người tạo có thuộc nhóm không
    const thanhVien = await prisma.thanhVienNhom.findUnique({
      where: {
        idNhom_idNguoiDung: {
          idNhom,
          idNguoiDung,
        },
      },
    });
    if (!thanhVien) return res.status(403).json({ message: 'Bạn không phải là thành viên nhóm này' });

    // Tạo deadline nhóm đồng thời khởi tạo bản ghi tiến độ cho tất cả thành viên trong nhóm
    const cacThanhVien = await prisma.thanhVienNhom.findMany({
      where: { idNhom },
      select: { idNguoiDung: true },
    });

    const deadlineNhom = await prisma.deadlineNhom.create({
      data: {
        idNhom,
        idNguoiTao: idNguoiDung,
        tieuDe: tieuDe.trim(),
        moTa: moTa ? moTa.trim() : null,
        hanChot: hanChotDate,
        doUuTien: doUuTien || 'binh_thuong',
        tienDos: {
          create: cacThanhVien.map((tv) => ({
            idNguoiDung: tv.idNguoiDung,
            trangThai: NHOM.DEFAULT_TRANG_THAI_TIEN_DO,
          })),
        },
      },
      include: {
        nguoiTao: { select: { id: true, ten: true, email: true } },
        tienDos: {
          include: {
            nguoiDung: { select: { id: true, ten: true, email: true, avatar: true } },
          },
        },
      },
    });

    res.status(201).json({ message: 'Thêm deadline nhóm thành công', deadline: deadlineNhom });
  } catch (error) {
    console.error('Lỗi thêm deadline nhóm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// 10. Sửa deadline nhóm
async function suaDeadlineNhom(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const idNhom = parseInt(req.params.id);
    const idDeadline = parseInt(req.params.idDeadline);
    const { tieuDe, moTa, hanChot, doUuTien } = req.body;
    if ((tieuDe !== undefined && !validText(tieuDe, 200)) || (moTa != null && !validText(moTa, 5000, false)) || (doUuTien !== undefined && !['thap', 'binh_thuong', 'cao'].includes(doUuTien))) return res.status(400).json({ message: 'Thông tin deadline không hợp lệ' });

    if (isNaN(idNhom) || isNaN(idDeadline)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const member = await prisma.thanhVienNhom.findUnique({ where: { idNhom_idNguoiDung: { idNhom, idNguoiDung } } });
    if (!member) return res.status(403).json({ message: 'Bạn không còn là thành viên của nhóm này' });

    const deadline = await prisma.deadlineNhom.findFirst({
      where: { id: idDeadline, idNhom },
      include: { nhom: true },
    });

    if (!deadline) return res.status(404).json({ message: 'Không tìm thấy deadline' });

    // Chỉ người tạo deadline hoặc chủ nhóm mới được sửa
    if (deadline.idNguoiTao !== idNguoiDung && deadline.nhom.idChuNhom !== idNguoiDung) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa deadline này' });
    }

    if (hanChot !== undefined && isNaN(parseVietnamDate(hanChot).getTime())) {
      return res.status(400).json({ message: 'Hạn chót không hợp lệ' });
    }

    const capNhat = await prisma.deadlineNhom.update({
      where: { id: idDeadline },
      data: {
        tieuDe: tieuDe ? tieuDe.trim() : undefined,
        moTa: moTa !== undefined ? (moTa ? moTa.trim() : null) : undefined,
        hanChot: hanChot ? parseVietnamDate(hanChot) : undefined,
        doUuTien: doUuTien || undefined,
      },
      include: {
        nguoiTao: { select: { id: true, ten: true, email: true } },
        tienDos: {
          include: {
            nguoiDung: { select: { id: true, ten: true, email: true, avatar: true } },
          },
        },
      },
    });

    res.json({ message: 'Cập nhật deadline nhóm thành công', deadline: capNhat });
  } catch (error) {
    console.error('Lỗi sửa deadline nhóm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// 11. Xóa deadline nhóm
async function xoaDeadlineNhom(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const idNhom = parseInt(req.params.id);
    const idDeadline = parseInt(req.params.idDeadline);

    if (isNaN(idNhom) || isNaN(idDeadline)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const member = await prisma.thanhVienNhom.findUnique({ where: { idNhom_idNguoiDung: { idNhom, idNguoiDung } } });
    if (!member) return res.status(403).json({ message: 'Bạn không còn là thành viên của nhóm này' });

    const deadline = await prisma.deadlineNhom.findFirst({
      where: { id: idDeadline, idNhom },
      include: { nhom: true },
    });

    if (!deadline) return res.status(404).json({ message: 'Không tìm thấy deadline' });

    if (deadline.idNguoiTao !== idNguoiDung && deadline.nhom.idChuNhom !== idNguoiDung) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa deadline này' });
    }

    await prisma.deadlineNhom.delete({ where: { id: idDeadline } });

    res.json({ message: 'Xóa deadline nhóm thành công' });
  } catch (error) {
    console.error('Lỗi xóa deadline nhóm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// 12. Cập nhật tiến độ của chính user cho 1 deadline nhóm
async function capNhatTienDo(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const idNhom = parseInt(req.params.id);
    const idDeadline = parseInt(req.params.idDeadline);
    const { trangThai, ghiChu } = req.body;
    if (ghiChu != null && !validText(ghiChu, 5000, false)) return res.status(400).json({ message: 'Ghi chú không hợp lệ' });

    if (isNaN(idNhom) || isNaN(idDeadline)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    if (trangThai !== undefined && !NHOM.TRANG_THAI_TIEN_DO.includes(trangThai)) {
      return res.status(400).json({ message: 'Trạng thái tiến độ không hợp lệ' });
    }

    // Kiểm tra user có thuộc nhóm không
    const thanhVien = await prisma.thanhVienNhom.findUnique({
      where: {
        idNhom_idNguoiDung: {
          idNhom,
          idNguoiDung,
        },
      },
    });
    if (!thanhVien) return res.status(403).json({ message: 'Bạn không phải là thành viên nhóm này' });

    const deadline = await prisma.deadlineNhom.findFirst({ where: { id: idDeadline, idNhom } });
    if (!deadline) return res.status(404).json({ message: 'Không tìm thấy deadline trong nhóm này' });

    const tienDo = await prisma.tienDoDeadlineNhom.upsert({
      where: {
        idDeadlineNhom_idNguoiDung: {
          idDeadlineNhom: idDeadline,
          idNguoiDung,
        },
      },
      update: {
        trangThai: trangThai || undefined,
        ghiChu: ghiChu !== undefined ? (ghiChu ? ghiChu.trim() : null) : undefined,
      },
      create: {
        idDeadlineNhom: idDeadline,
        idNguoiDung,
        trangThai: trangThai || NHOM.DEFAULT_TRANG_THAI_TIEN_DO,
        ghiChu: ghiChu ? ghiChu.trim() : null,
      },
      include: {
        nguoiDung: { select: { id: true, ten: true, email: true, avatar: true } },
      },
    });

    res.json({ message: 'Đã cập nhật tiến độ của bạn', tienDo });
  } catch (error) {
    console.error('Lỗi cập nhật tiến độ:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

module.exports = {
  taoNhom,
  thamGiaNhom,
  layDanhSachNhom,
  layChiTietNhom,
  suaNhom,
  xoaNhom,
  roiNhom,
  kickThanhVien,
  themDeadlineNhom,
  suaDeadlineNhom,
  xoaDeadlineNhom,
  capNhatTienDo,
};
