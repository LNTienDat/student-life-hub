const { validText } = require('../../utils/validation.util');
const { serializable, httpError } = require('../../utils/transaction.util');
const prisma = require('../../prismaClient');
const PDFDocument = require('pdfkit');
const path = require('path');
const { tinhDiemMon } = require('../../utils/grade.util');
const { ACADEMIC } = require('../../constants');
const { finiteNumber } = require('../../utils/number.util');
const {
  tinhGPAService,
  canhBaoMonNguyCoService,
  gpaTheoKyService,
  duDoanDiemService,
} = require('./academic.service');

// Font Unicode nhúng sẵn trong project (không phụ thuộc hệ điều hành) —
// bản trước dùng đường dẫn font hệ thống Windows (C:\Windows\Fonts\...),
// chỉ chạy đúng trên máy Windows của người viết code, còn deploy lên
// server Linux thật (Render, Railway...) sẽ âm thầm mất dấu tiếng Việt.
const duongDanFontThuong = path.join(__dirname, '../../assets/fonts/BeVietnamPro-Regular.ttf');
const duongDanFontDam = path.join(__dirname, '../../assets/fonts/BeVietnamPro-Bold.ttf');

// Thêm môn học mới
async function themMonHoc(req, res) {
  try {
    const { ten, tinChi, hocKy } = req.body;
    const idNguoiDung = req.user.id;

    if (!validText(ten) || !tinChi || !validText(hocKy)) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên môn, tín chỉ, học kỳ' });
    }
    const tinChiSo = finiteNumber(tinChi);
    if (!Number.isInteger(tinChiSo) || tinChiSo < ACADEMIC.MIN_TIN_CHI_MON || tinChiSo > ACADEMIC.MAX_TIN_CHI_MON) {
      return res.status(400).json({ message: `Số tín chỉ phải là số nguyên dương hợp lý (từ ${ACADEMIC.MIN_TIN_CHI_MON} đến ${ACADEMIC.MAX_TIN_CHI_MON})` });
    }

    const monHoc = await prisma.monHoc.create({
      data: { ten: ten.trim(), tinChi: tinChiSo, hocKy: hocKy.trim(), idNguoiDung },
    });

    res.status(201).json({ message: 'Thêm môn học thành công', monHoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Lấy danh sách môn học của user
async function layDanhSachMonHoc(req, res) {
  try {
    const idNguoiDung = req.user.id;

    const danhSach = await prisma.monHoc.findMany({
      where: { idNguoiDung, ...(req.query.hocKy ? { hocKy: String(req.query.hocKy) } : {}) },
      include: { diems: true },
      orderBy: { ngayTao: 'desc' },
    });

    res.json({ monHocs: danhSach });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Sửa môn học — chỉ cho sửa nếu môn học thuộc về đúng người đang đăng nhập
async function suaMonHoc(req, res) {
  try {
    const { id } = req.params;
    const idNguoiDung = req.user.id;
    const { ten, tinChi, hocKy, trangThai } = req.body;
    if ((ten !== undefined && !validText(ten)) || (hocKy !== undefined && !validText(hocKy)) || (trangThai !== undefined && !['active', 'completed', 'inactive'].includes(trangThai))) return res.status(400).json({ message: 'Thông tin môn học không hợp lệ' });

    if (tinChi !== undefined && (!Number.isInteger(finiteNumber(tinChi)) || finiteNumber(tinChi) < ACADEMIC.MIN_TIN_CHI_MON || finiteNumber(tinChi) > ACADEMIC.MAX_TIN_CHI_MON)) {
      return res.status(400).json({ message: `Số tín chỉ phải là số nguyên dương hợp lý (tối đa ${ACADEMIC.MAX_TIN_CHI_MON})` });
    }

    const ketQua = await prisma.monHoc.updateMany({
      where: { id: parseInt(id), idNguoiDung },
      data: { ten: ten?.trim(), tinChi: tinChi !== undefined ? finiteNumber(tinChi) : undefined, hocKy: hocKy?.trim(), trangThai },
    });

    if (ketQua.count === 0) {
      return res.status(404).json({ message: 'Không tìm thấy môn học hoặc bạn không có quyền sửa' });
    }

    const monHoc = await prisma.monHoc.findUnique({ where: { id: parseInt(id) } });
    res.json({ message: 'Cập nhật thành công', monHoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Xóa môn học — chỉ cho xóa nếu môn học thuộc về đúng người đang đăng nhập
async function xoaMonHoc(req, res) {
  try {
    const { id } = req.params;
    const idNguoiDung = req.user.id;

    const ketQua = await prisma.monHoc.deleteMany({ where: { id: parseInt(id), idNguoiDung } });

    if (ketQua.count === 0) {
      return res.status(404).json({ message: 'Không tìm thấy môn học hoặc bạn không có quyền xóa' });
    }
    res.json({ message: 'Xóa môn học thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Thêm điểm cho môn học — chỉ cho thêm nếu môn học thuộc về đúng người đang đăng nhập
async function themDiem(req, res) {
  try {
    const idMonHoc = Number(req.body.idMonHoc || req.params.idMonHoc);
    const { loaiDanhGia, diem, trongSo } = req.body;
    if (!Number.isSafeInteger(idMonHoc) || idMonHoc <= 0 || !validText(loaiDanhGia) || !Number.isFinite(finiteNumber(diem)) || finiteNumber(diem) < 0 || finiteNumber(diem) > 10 || !Number.isFinite(finiteNumber(trongSo)) || finiteNumber(trongSo) <= 0 || finiteNumber(trongSo) > 100) return res.status(400).json({ message: 'Điểm, trọng số hoặc loại đánh giá không hợp lệ' });
    const diemMoi = await serializable(prisma, async tx => {
      const mon = await tx.monHoc.findFirst({ where: { id: idMonHoc, idNguoiDung: req.user.id }, include: { diems: true } });
      if (!mon) throw httpError(404, 'Không tìm thấy môn học hoặc bạn không có quyền thêm điểm');
      if ((mon.diems || []).reduce((sum, d) => sum + d.trongSo, 0) + finiteNumber(trongSo) > 100 + 1e-8) throw httpError(400, 'Tổng trọng số các cột điểm không được vượt quá 100%');
      return tx.diem.create({ data: { idMonHoc, loaiDanhGia: loaiDanhGia.trim(), diem: finiteNumber(diem), trongSo: finiteNumber(trongSo) } });
    });
    res.status(201).json({ message: 'Thêm điểm thành công', diem: diemMoi });
  } catch (error) { res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Chưa lưu được điểm. Vui lòng thử lại.' }); }
}

async function suaDiem(req, res) {
  try {
    const { loaiDanhGia, diem, trongSo } = req.body;
    if ((loaiDanhGia !== undefined && !validText(loaiDanhGia)) || (diem !== undefined && (!Number.isFinite(finiteNumber(diem)) || finiteNumber(diem) < 0 || finiteNumber(diem) > 10)) || (trongSo !== undefined && (!Number.isFinite(finiteNumber(trongSo)) || finiteNumber(trongSo) <= 0 || finiteNumber(trongSo) > 100))) return res.status(400).json({ message: 'Điểm hoặc trọng số không hợp lệ' });
    const result = await serializable(prisma, async tx => {
      const current = await tx.diem.findFirst({ where: { id: Number(req.params.id), monHoc: { idNguoiDung: req.user.id } }, include: { monHoc: { include: { diems: true } } } });
      if (!current) throw httpError(404, 'Không tìm thấy điểm hoặc bạn không có quyền sửa');
      const weight = trongSo === undefined ? current.trongSo : finiteNumber(trongSo);
      const total = current.monHoc.diems.filter(d => d.id !== current.id).reduce((sum, d) => sum + d.trongSo, weight);
      if (total > 100 + 1e-8) throw httpError(400, 'Tổng trọng số các cột điểm không được vượt quá 100%');
      return tx.diem.update({ where: { id: current.id }, data: { loaiDanhGia: loaiDanhGia?.trim(), diem: diem === undefined ? undefined : finiteNumber(diem), trongSo: weight } });
    });
    res.json({ message: 'Cập nhật điểm thành công', diem: result });
  } catch (error) { res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Chưa lưu được điểm. Vui lòng thử lại.' }); }
}

async function xoaDiem(req, res) {
  try {
    const { id } = req.params;
    const idNguoiDung = req.user.id;

    const diemHienTai = await prisma.diem.findFirst({
      where: {
        id: parseInt(id),
        monHoc: { idNguoiDung },
      },
    });

    if (!diemHienTai) {
      return res.status(404).json({ message: 'Không tìm thấy điểm hoặc bạn không có quyền xóa' });
    }

    await prisma.diem.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Xóa điểm thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Tính GPA của user
async function tinhGPA(req, res) {
  try {
    const idNguoiDung = req.user.id;

    const monHocs = await prisma.monHoc.findMany({
      where: { idNguoiDung, ...(req.query.hocKy ? { hocKy: String(req.query.hocKy) } : {}) },
      include: { diems: true },
    });

    res.json(tinhGPAService(monHocs));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Dự đoán điểm cần đạt ở đầu điểm còn thiếu để đạt mục tiêu
async function duDoanDiem(req, res) {
  try {
    const { idMonHoc } = req.params;
    const idNguoiDung = req.user.id;
    const { mucTieu, trongSoConLai } = req.body;

    if (mucTieu === undefined || trongSoConLai === undefined) {
      return res.status(400).json({ message: 'Vui lòng nhập mục tiêu và trọng số còn lại' });
    }
    if (!Number.isFinite(finiteNumber(mucTieu)) || finiteNumber(mucTieu) < 0 || finiteNumber(mucTieu) > ACADEMIC.THANG_DIEM_MAX) {
      return res.status(400).json({ message: `Điểm mục tiêu phải nằm trong khoảng 0 đến ${ACADEMIC.THANG_DIEM_MAX}` });
    }
    if (!Number.isFinite(finiteNumber(trongSoConLai)) || finiteNumber(trongSoConLai) <= 0 || finiteNumber(trongSoConLai) > ACADEMIC.TONG_TRONG_SO_CHUAN) {
      return res.status(400).json({ message: `Trọng số còn lại phải lớn hơn 0 và không vượt quá ${ACADEMIC.TONG_TRONG_SO_CHUAN}` });
    }

    const monHoc = await prisma.monHoc.findFirst({
      where: { id: parseInt(idMonHoc), idNguoiDung },
      include: { diems: true },
    });

    if (!monHoc) {
      return res.status(404).json({ message: 'Không tìm thấy môn học' });
    }

    // Tổng điểm đã đạt được từ các đầu điểm hiện có (quy theo trọng số)
    const tongDaBiet = monHoc.diems.reduce(
      (sum, d) => sum + d.diem * (d.trongSo / 100),
      0
    );

    const ketQua = duDoanDiemService(tongDaBiet, trongSoConLai, mucTieu);
    res.json(ketQua);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Cảnh báo các môn có nguy cơ điểm thấp
async function canhBaoMonNguyCo(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const nguong = req.query.nguong ? parseFloat(req.query.nguong) : ACADEMIC.DEFAULT_NGUONG_CANH_BAO;

    const monHocs = await prisma.monHoc.findMany({
      where: { idNguoiDung, ...(req.query.hocKy ? { hocKy: String(req.query.hocKy) } : {}) },
      include: { diems: true },
    });

    const monNguyCo = canhBaoMonNguyCoService(monHocs, nguong);
    res.json({ nguong, monNguyCo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// GPA theo từng học kỳ
async function gpaTheoKy(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const monHocs = await prisma.monHoc.findMany({
      where: { idNguoiDung, ...(req.query.hocKy ? { hocKy: String(req.query.hocKy) } : {}) },
      include: { diems: true },
    });

    const theoKy = gpaTheoKyService(monHocs);
    res.json({ theoKy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// CN13 - Xuất bảng điểm ra file PDF
async function xuatBangDiemPDF(req, res) {
  try {
    const idNguoiDung = req.user.id;

    const nguoiDung = await prisma.nguoiDung.findUnique({ where: { id: idNguoiDung } });
    const monHocs = await prisma.monHoc.findMany({
      where: { idNguoiDung, ...(req.query.hocKy ? { hocKy: String(req.query.hocKy) } : {}) },
      include: { diems: true },
      orderBy: { hocKy: 'asc' },
    });

    // Tính điểm từng môn (thang 10, có trọng số) - dùng đúng công thức của tinhGPA
    let tongDiemTinChi = 0;
    let tongTinChi = 0;
    const hangMonHoc = monHocs.map((mon) => {
      const { diemTrungBinh: tempDiem, tongTrongSo } = tinhDiemMon(mon.diems);
      let diemMon = null;
      if (tongTrongSo > 0) {
        diemMon = tempDiem;
        tongDiemTinChi += diemMon * mon.tinChi;
        tongTinChi += mon.tinChi;
      }
      return { ...mon, diemMon };
    });
    const gpa = tongTinChi > 0 ? (tongDiemTinChi / tongTinChi).toFixed(2) : null;

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.registerFont('FontViet', duongDanFontThuong);
    doc.registerFont('FontViet-Bold', duongDanFontDam);
    doc.font('FontViet');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bang-diem.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).font('FontViet-Bold').text('BẢNG ĐIỂM SINH VIÊN', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).font('FontViet').text(`Họ tên: ${nguoiDung?.ten || ''}`);
    doc.text(`Email: ${nguoiDung?.email || ''}`);
    if (nguoiDung?.truong) doc.text(`Trường: ${nguoiDung.truong}`);
    if (nguoiDung?.nganh) doc.text(`Ngành: ${nguoiDung.nganh}`);
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`);
    doc.moveDown();

    const startX = 40;
    const colWidths = [220, 60, 90, 90];
    doc.fontSize(10).font('FontViet-Bold');
    let y = doc.y;
    ['Môn học', 'Tín chỉ', 'Học kỳ', 'Điểm (thang 10)'].forEach((h, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(h, x, y, { width: colWidths[i] });
    });
    doc.moveDown(0.5);
    doc.font('FontViet');

    hangMonHoc.forEach((mon) => {
      y = doc.y;
      if (y > 750) {
        doc.addPage();
        y = doc.y;
      }
      const rowData = [
        mon.ten,
        String(mon.tinChi),
        mon.hocKy || '',
        mon.diemMon !== null ? mon.diemMon.toFixed(2) : '-',
      ];
      rowData.forEach((val, i) => {
        const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(val, x, y, { width: colWidths[i] });
      });
      doc.moveDown(0.6);
    });

    doc.moveDown();
    doc.font('FontViet-Bold').fontSize(12).text(`GPA tích lũy (thang 10): ${gpa ?? 'Chưa có dữ liệu'}`);
    doc.text(`Tổng số tín chỉ đã tính: ${tongTinChi}`);

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Không thể xuất bảng điểm' });
  }
}

module.exports = {
  themMonHoc,
  layDanhSachMonHoc,
  suaMonHoc,
  xoaMonHoc,
  themDiem,
  suaDiem,
  xoaDiem,
  tinhGPA,
  duDoanDiem,
  canhBaoMonNguyCo,
  gpaTheoKy,
  xuatBangDiemPDF,
};
