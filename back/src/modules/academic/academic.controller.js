const prisma = require('../../prismaClient');
const PDFDocument = require('pdfkit');

// Thêm môn học mới
async function themMonHoc(req, res) {
  try {
    const { ten, tinChi, hocKy } = req.body;
    const idNguoiDung = req.user.id;

    if (!ten || !tinChi || !hocKy) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên môn, tín chỉ, học kỳ' });
    }

    const monHoc = await prisma.monHoc.create({
      data: { ten, tinChi: parseInt(tinChi), hocKy, idNguoiDung },
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
      where: { idNguoiDung },
      include: { diems: true },
      orderBy: { ngayTao: 'desc' },
    });

    res.json({ monHocs: danhSach });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Sửa môn học
async function suaMonHoc(req, res) {
  try {
    const { id } = req.params;
    const { ten, tinChi, hocKy, trangThai } = req.body;

    const monHoc = await prisma.monHoc.update({
      where: { id: parseInt(id) },
      data: { ten, tinChi: tinChi ? parseInt(tinChi) : undefined, hocKy, trangThai },
    });

    res.json({ message: 'Cập nhật thành công', monHoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Xóa môn học
async function xoaMonHoc(req, res) {
  try {
    const { id } = req.params;
    await prisma.monHoc.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Xóa môn học thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Thêm điểm cho môn học
async function themDiem(req, res) {
  try {
    const { idMonHoc, loaiDanhGia, diem, trongSo } = req.body;

    if (!idMonHoc || !loaiDanhGia || diem === undefined || trongSo === undefined) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin điểm' });
    }

    const diemMoi = await prisma.diem.create({
      data: {
        idMonHoc: parseInt(idMonHoc),
        loaiDanhGia,
        diem: parseFloat(diem),
        trongSo: parseFloat(trongSo),
      },
    });

    res.status(201).json({ message: 'Thêm điểm thành công', diem: diemMoi });
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
      where: { idNguoiDung },
      include: { diems: true },
    });

    let tongDiemTinChi = 0;
    let tongTinChi = 0;

    const chiTiet = monHocs.map((mon) => {
      let diemMon = 0;
      const tongTrongSo = mon.diems.reduce((sum, d) => sum + d.trongSo, 0);

      if (tongTrongSo > 0) {
        diemMon = mon.diems.reduce((sum, d) => sum + d.diem * (d.trongSo / 100), 0);
        tongDiemTinChi += diemMon * mon.tinChi;
        tongTinChi += mon.tinChi;
      }

      return { ten: mon.ten, tinChi: mon.tinChi, diemMon: diemMon.toFixed(2) };
    });

    const gpa = tongTinChi > 0 ? (tongDiemTinChi / tongTinChi).toFixed(2) : 0;

    res.json({ gpa, chiTiet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Dự đoán điểm cần đạt ở đầu điểm còn thiếu để đạt mục tiêu
async function duDoanDiem(req, res) {
  try {
    const { idMonHoc } = req.params;
    const { mucTieu, trongSoConLai } = req.body;

    if (mucTieu === undefined || trongSoConLai === undefined) {
      return res.status(400).json({ message: 'Vui lòng nhập mục tiêu và trọng số còn lại' });
    }

    const monHoc = await prisma.monHoc.findUnique({
      where: { id: parseInt(idMonHoc) },
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

    const trongSoConLaiSo = parseFloat(trongSoConLai) / 100;
    const mucTieuSo = parseFloat(mucTieu);

    if (trongSoConLaiSo <= 0) {
      return res.status(400).json({ message: 'Trọng số còn lại phải lớn hơn 0' });
    }

    const diemCanDat = (mucTieuSo - tongDaBiet) / trongSoConLaiSo;

    res.json({
      mucTieu: mucTieuSo,
      tongDaDat: tongDaBiet.toFixed(2),
      diemCanDat: diemCanDat.toFixed(2),
      khaThi: diemCanDat <= 10 && diemCanDat >= 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Cảnh báo các môn có nguy cơ điểm thấp
async function canhBaoMonNguyCo(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const nguong = req.query.nguong ? parseFloat(req.query.nguong) : 5.0;

    const monHocs = await prisma.monHoc.findMany({
      where: { idNguoiDung },
      include: { diems: true },
    });

    const monNguyCo = monHocs
      .map((mon) => {
        const tongTrongSoDaCham = mon.diems.reduce((sum, d) => sum + d.trongSo, 0);
        const diemHienTai = mon.diems.reduce(
          (sum, d) => sum + d.diem * (d.trongSo / 100),
          0
        );
        return {
          ten: mon.ten,
          diemHienTai: diemHienTai.toFixed(2),
          tongTrongSoDaCham,
        };
      })
      .filter((mon) => mon.tongTrongSoDaCham > 0 && parseFloat(mon.diemHienTai) < nguong);

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
      where: { idNguoiDung },
      include: { diems: true },
    });

    const theoKy = {};
    monHocs.forEach((mon) => {
      const tongTrongSo = mon.diems.reduce((sum, d) => sum + d.trongSo, 0);
      if (tongTrongSo === 0) return;

      const diemMon = mon.diems.reduce((sum, d) => sum + d.diem * (d.trongSo / 100), 0);

      if (!theoKy[mon.hocKy]) {
        theoKy[mon.hocKy] = { tongDiemTinChi: 0, tongTinChi: 0 };
      }
      theoKy[mon.hocKy].tongDiemTinChi += diemMon * mon.tinChi;
      theoKy[mon.hocKy].tongTinChi += mon.tinChi;
    });

    const ketQua = Object.entries(theoKy).map(([hocKy, data]) => ({
      hocKy,
      gpa: (data.tongDiemTinChi / data.tongTinChi).toFixed(2),
    }));

    res.json({ theoKy: ketQua });
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
      where: { idNguoiDung },
      include: { diems: true },
      orderBy: { hocKy: 'asc' },
    });

    // Tính điểm từng môn (thang 10, có trọng số) - dùng đúng công thức của tinhGPA
    let tongDiemTinChi = 0;
    let tongTinChi = 0;
    const hangMonHoc = monHocs.map((mon) => {
      const tongTrongSo = mon.diems.reduce((sum, d) => sum + d.trongSo, 0);
      let diemMon = null;
      if (tongTrongSo > 0) {
        diemMon = mon.diems.reduce((sum, d) => sum + d.diem * (d.trongSo / 100), 0);
        tongDiemTinChi += diemMon * mon.tinChi;
        tongTinChi += mon.tinChi;
      }
      return { ...mon, diemMon };
    });
    const gpa = tongTinChi > 0 ? (tongDiemTinChi / tongTinChi).toFixed(2) : null;

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bang-diem.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).text('BẢNG ĐIỂM SINH VIÊN', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Họ tên: ${nguoiDung?.ten || ''}`);
    doc.text(`Email: ${nguoiDung?.email || ''}`);
    if (nguoiDung?.truong) doc.text(`Trường: ${nguoiDung.truong}`);
    if (nguoiDung?.nganh) doc.text(`Ngành: ${nguoiDung.nganh}`);
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`);
    doc.moveDown();

    const startX = 40;
    const colWidths = [220, 60, 90, 90];
    doc.fontSize(10).font('Helvetica-Bold');
    let y = doc.y;
    ['Môn học', 'Tín chỉ', 'Học kỳ', 'Điểm (thang 10)'].forEach((h, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(h, x, y, { width: colWidths[i] });
    });
    doc.moveDown(0.5);
    doc.font('Helvetica');

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
    doc.font('Helvetica-Bold').fontSize(12).text(`GPA tích lũy (thang 10): ${gpa ?? 'Chưa có dữ liệu'}`);
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
  tinhGPA,
  duDoanDiem,
  canhBaoMonNguyCo,
  gpaTheoKy,
  xuatBangDiemPDF,
};