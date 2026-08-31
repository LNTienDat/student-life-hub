const prisma = require('../../prismaClient');
const { nhacDeadlineQuaEmail, canhBaoNganSachQuaEmail } = require('../../cron/thongBao.cron');

// CN31: Tổng hợp thông báo in-app (chuông) — gộp 3 nguồn: deadline sắp hết hạn,
// môn học nguy cơ điểm thấp, và danh mục vượt ngân sách tháng này.
async function layThongBao(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const now = new Date();
    const gioiHan = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 1. Deadline sắp hết hạn trong 24h
    const deadlines = await prisma.deadline.findMany({
      where: {
        idNguoiDung,
        trangThai: 'dang_dien_hanh',
        hanChot: { gte: now, lte: gioiHan },
      },
      orderBy: { hanChot: 'asc' },
    });

    // 2. Môn học nguy cơ điểm thấp
    const monHocs = await prisma.monHoc.findMany({
      where: { idNguoiDung },
      include: { diems: true },
    });
    const monNguyCo = monHocs
      .map((mon) => {
        const tongTrongSoDaCham = mon.diems.reduce((sum, d) => sum + d.trongSo, 0);
        const diemHienTai = mon.diems.reduce((sum, d) => sum + d.diem * (d.trongSo / 100), 0);
        return { ten: mon.ten, diemHienTai: diemHienTai.toFixed(2), tongTrongSoDaCham };
      })
      .filter((mon) => mon.tongTrongSoDaCham > 0 && parseFloat(mon.diemHienTai) < 5.0);

    // 3. Danh mục vượt ngân sách tháng hiện tại
    const thang = now.getMonth() + 1;
    const nam = now.getFullYear();
    const nganSachs = await prisma.nganSach.findMany({ where: { idNguoiDung, thang, nam } });
    const from = new Date(nam, thang - 1, 1);
    const to = new Date(nam, thang, 1);
    const giaoDichs = await prisma.giaoDich.findMany({
      where: { idNguoiDung, loai: 'chi', ngayGiaoDich: { gte: from, lt: to } },
    });
    const nganSachVuot = nganSachs
      .map((ns) => {
        const daChi = giaoDichs
          .filter((g) => g.danhMuc === ns.danhMuc)
          .reduce((sum, g) => sum + g.soTien, 0);
        return { danhMuc: ns.danhMuc, soTienToiDa: ns.soTienToiDa, daChi };
      })
      .filter((ns) => ns.daChi > ns.soTienToiDa);

    // Gộp thành 1 danh sách thông báo có id thống nhất để frontend đánh dấu "đã đọc"
    const thongBaos = [
      ...deadlines.map((d) => ({
        id: `deadline-${d.id}`,
        loai: 'deadline',
        tieuDe: `Deadline sắp hết hạn: ${d.tieuDe}`,
        moTa: `Hạn chót: ${new Date(d.hanChot).toLocaleString('vi-VN')}`,
        thoiGian: d.hanChot,
      })),
      ...monNguyCo.map((mon) => ({
        id: `hoctap-${mon.ten}`,
        loai: 'hoc_tap',
        tieuDe: `Môn nguy cơ điểm thấp: ${mon.ten}`,
        moTa: `Điểm hiện tại: ${mon.diemHienTai}/10`,
        thoiGian: now,
      })),
      ...nganSachVuot.map((ns) => ({
        id: `ngansach-${ns.danhMuc}-${thang}-${nam}`,
        loai: 'ngan_sach',
        tieuDe: `Vượt ngân sách: ${ns.danhMuc.replace('_', ' ')}`,
        moTa: `Đã chi ${ns.daChi.toLocaleString('vi-VN')}đ / hạn mức ${ns.soTienToiDa.toLocaleString('vi-VN')}đ`,
        thoiGian: now,
      })),
    ];

    res.json({ thongBaos, tongSo: thongBaos.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Kích hoạt thủ công cron nhắc deadline — dùng để test gửi email không cần chờ tới giờ đã lên lịch
async function testCronDeadline(req, res) {
  try {
    await nhacDeadlineQuaEmail();
    res.json({ message: 'Đã chạy thử job nhắc deadline. Kiểm tra console/email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Kích hoạt thủ công cron cảnh báo ngân sách — dùng để test gửi email không cần chờ tới giờ đã lên lịch
async function testCronNganSach(req, res) {
  try {
    await canhBaoNganSachQuaEmail();
    res.json({ message: 'Đã chạy thử job cảnh báo ngân sách. Kiểm tra console/email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

module.exports = { layThongBao, testCronDeadline, testCronNganSach };
