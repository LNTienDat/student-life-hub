const prisma = require('../../prismaClient');
const { nhacDeadlineQuaEmail, canhBaoNganSachQuaEmail } = require('../../cron/thongBao.cron');
const { tinhDiemMon } = require('../../utils/grade.util');

// CN31: Tổng hợp thông báo in-app (chuông) — gộp 3 nguồn: deadline sắp hết hạn,
// môn học nguy cơ điểm thấp, và danh mục vượt ngân sách tháng này.
async function layThongBao(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const now = new Date();
    const gioiHan = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const thang = now.getMonth() + 1;
    const nam = now.getFullYear();
    const from = new Date(nam, thang - 1, 1);
    const to = new Date(nam, thang, 1);

    const [deadlines, monHocs, nganSachs, giaoDichs] = await Promise.all([
      prisma.deadline.findMany({
        where: {
          idNguoiDung,
          trangThai: 'dang_dien_hanh',
          hanChot: { gte: now, lte: gioiHan },
        },
        orderBy: { hanChot: 'asc' },
      }),
      prisma.monHoc.findMany({
        where: { idNguoiDung },
        include: { diems: true },
      }),
      prisma.nganSach.findMany({ where: { idNguoiDung, thang, nam } }),
      prisma.giaoDich.findMany({
        where: { idNguoiDung, loai: 'chi', ngayGiaoDich: { gte: from, lt: to } },
      }),
    ]);

    // 2. Môn học nguy cơ điểm thấp
    const monNguyCo = monHocs
      .map((mon) => {
        const { diemTrungBinh: diemHienTai, tongTrongSo: tongTrongSoDaCham } = tinhDiemMon(mon.diems);
        const diemQuyDoi = tongTrongSoDaCham > 0 ? (diemHienTai / (tongTrongSoDaCham / 100)) : 0;
        return { ten: mon.ten, diemHienTai: diemQuyDoi.toFixed(2), tongTrongSoDaCham };
      })
      .filter((mon) => mon.tongTrongSoDaCham > 0 && parseFloat(mon.diemHienTai) < 5.0);

    // 3. Danh mục vượt ngân sách tháng hiện tại
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

// Kích hoạt thủ công cron nhắc deadline — dùng để test gửi email không cần chờ tới giờ đã lên lịch.
// Chỉ chạy cho đúng người gọi API (không phải toàn hệ thống), tránh 1 tài khoản
// bất kỳ có thể lợi dụng để spam email tới mọi người dùng khác.
async function testCronDeadline(req, res) {
  try {
    await nhacDeadlineQuaEmail(req.user.id);
    res.json({ message: 'Đã chạy thử job nhắc deadline cho tài khoản của bạn. Kiểm tra console/email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Kích hoạt thủ công cron cảnh báo ngân sách — tương tự, chỉ chạy cho người gọi API.
async function testCronNganSach(req, res) {
  try {
    await canhBaoNganSachQuaEmail(req.user.id);
    res.json({ message: 'Đã chạy thử job cảnh báo ngân sách cho tài khoản của bạn. Kiểm tra console/email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

module.exports = { layThongBao, testCronDeadline, testCronNganSach };
