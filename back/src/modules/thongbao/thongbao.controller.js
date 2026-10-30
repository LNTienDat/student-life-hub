const { vietnamParts, monthRange } = require('../../utils/date.util');
const prisma = require('../../prismaClient');
const { tongHopGiaoDich } = require('../finance/finance.repository');
const { nhacDeadlineQuaEmail, canhBaoNganSachQuaEmail } = require('../../cron/thongBao.cron');
const { canhBaoMonNguyCoService } = require('../academic/academic.service');
const { kiemTraNganSachService } = require('../finance/finance.service');
const { categoryLabels } = require('../finance/category.service');
const { ACADEMIC } = require('../../constants');

// CN31: Tổng hợp thông báo in-app (chuông) — gộp 3 nguồn: deadline sắp hết hạn,
// môn học nguy cơ điểm thấp, và danh mục vượt ngân sách tháng này.
async function layThongBao(req, res) {
  try {
    const idNguoiDung = req.user.id;
    const now = new Date();
    const part=vietnamParts(now);
    const gioiHan = new Date(Date.UTC(part.year,part.month-1,part.day+4)-7*3600000-1);
    const { month: thang, year: nam } = vietnamParts(now);
    const { from, to } = monthRange(thang, nam);

    const [deadlines, monHocs, nganSachs, giaoDichs] = await Promise.all([
      prisma.deadline.findMany({
        where: {
          idNguoiDung,
          trangThai: { not: 'hoan_thanh' },
          hanChot: { lte: gioiHan },
        },
        orderBy: { hanChot: 'asc' },
      }),
      prisma.monHoc.findMany({
        where: { idNguoiDung },
        include: { diems: true },
      }),
      prisma.nganSach.findMany({ where: { idNguoiDung, thang, nam } }),
      tongHopGiaoDich({ idNguoiDung, loai: 'chi', ngayGiaoDich: { gte: from, lt: to } }),
    ]);

    // 2. Môn học nguy cơ điểm thấp (dùng chung service của academic)
    const monNguyCo = canhBaoMonNguyCoService(monHocs, ACADEMIC.DEFAULT_NGUONG_CANH_BAO);

    // 3. Danh mục vượt ngân sách tháng hiện tại (dùng chung service của finance)
    const nganSachVuot = kiemTraNganSachService(nganSachs, giaoDichs).filter((ns) => ns.vuotNganSach);

    // Gộp thành 1 danh sách thông báo có id thống nhất để frontend đánh dấu "đã đọc"
    const labels = await categoryLabels(idNguoiDung);
    const thongBaos = [
      ...deadlines.map((d) => ({
        id: `deadline-${d.id}-${new Date(d.hanChot).getTime()}`,
        loai: 'deadline',
        tieuDe: `Deadline: ${d.tieuDe}`,
        moTa: `Hạn chót: ${new Date(d.hanChot).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
        thoiGian: d.hanChot,
      })),
      ...monNguyCo.map((mon) => ({
        id: `hoctap-${mon.id}`,
        loai: 'hoc_tap',
        tieuDe: `Môn nguy cơ điểm thấp: ${mon.ten}`,
        moTa: `Điểm hiện tại: ${mon.diemHienTai}/10`,
        thoiGian: now,
      })),
      ...nganSachVuot.map((ns) => ({
        id: `ngansach-${ns.danhMuc}-${thang}-${nam}`,
        loai: 'ngan_sach',
        tieuDe: `Vượt ngân sách: ${labels['chi:'+ns.danhMuc] || labels[ns.danhMuc] || ns.danhMuc}`,
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
