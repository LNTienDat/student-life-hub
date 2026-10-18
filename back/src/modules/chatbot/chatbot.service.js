/**
 * chatbot.service.js
 * Tầng nghiệp vụ cho Context Injection — truy vấn dữ liệu cá nhân sinh viên
 * để inject vào system prompt của Gemini, biến chatbot thành Personal AI Agent.
 */

const prisma = require('../../prismaClient');
const { tinhGPAService, canhBaoMonNguyCoService } = require('../academic/academic.service');
const { thongKeTaiChinhService } = require('../finance/finance.service');
const { CHATBOT } = require('../../constants');

/**
 * Lấy thứ trong tuần theo quy ước DB: 2=Thứ 2, 3=Thứ 3, ..., 7=Thứ 7, 8=Chủ nhật
 * @param {Date} date
 * @returns {number}
 */
function layThuTrongTuan(date) {
  const jsDay = date.getDay(); // 0=CN, 1=T2, ..., 6=T7
  return jsDay === 0 ? 8 : jsDay + 1;
}

/**
 * Format tên thứ từ số
 * @param {number} thu
 * @returns {string}
 */
function tenThu(thu) {
  const map = { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật' };
  return map[thu] || `Thứ ${thu}`;
}

/**
 * Format số tiền VND ngắn gọn
 * @param {number} soTien
 * @returns {string}
 */
function formatTien(soTien) {
  if (soTien >= 1_000_000) return `${(soTien / 1_000_000).toFixed(1)}tr`;
  if (soTien >= 1_000) return `${(soTien / 1_000).toFixed(0)}k`;
  return `${soTien}đ`;
}

/**
 * Truy vấn toàn bộ dữ liệu cá nhân sinh viên và format thành chuỗi context ngắn gọn.
 * Được gọi mỗi lần user gửi tin nhắn cho chatbot → inject vào system prompt.
 *
 * @param {number} userId - ID người dùng từ JWT
 * @returns {Promise<string>} Chuỗi text mô tả ngữ cảnh cá nhân
 */
async function layNguCanhSinhVien(userId) {
  const now = new Date();
  const thuHomNay = layThuTrongTuan(now);
  const dauThang = new Date(now.getFullYear(), now.getMonth(), 1);
  const cuoiTuanToi = new Date(now);
  cuoiTuanToi.setDate(cuoiTuanToi.getDate() + CHATBOT.CONTEXT_DEADLINE_DAYS);

  // Truy vấn song song 4 loại dữ liệu để tối ưu tốc độ
  const [monHocs, deadlines, giaoDichs, lichHoc] = await Promise.all([
    // 1. Môn học + điểm (cho GPA & cảnh báo)
    prisma.monHoc.findMany({
      where: { idNguoiDung: userId, trangThai: 'active' },
      include: { diems: true },
    }),

    // 2. Deadline sắp tới (7 ngày, chưa hoàn thành)
    prisma.deadline.findMany({
      where: {
        idNguoiDung: userId,
        trangThai: { not: 'hoan_thanh' },
        hanChot: { gte: now, lte: cuoiTuanToi },
      },
      orderBy: { hanChot: 'asc' },
      take: 10,
      include: { monHoc: { select: { ten: true } } },
    }),

    // 3. Giao dịch tháng này (cho thống kê tài chính)
    prisma.giaoDich.findMany({
      where: {
        idNguoiDung: userId,
        ngayGiaoDich: { gte: dauThang },
      },
    }),

    // 4. Lịch học hôm nay
    prisma.thoiKhoaBieu.findMany({
      where: { idNguoiDung: userId, thu: thuHomNay },
      orderBy: { gioBatDau: 'asc' },
    }),
  ]);

  // --- Xây dựng chuỗi context ---
  const parts = [];

  // GPA
  if (monHocs.length > 0) {
    const { gpa } = tinhGPAService(monHocs);
    parts.push(`📊 GPA tích lũy: ${gpa}/10 (${monHocs.length} môn đang học)`);

    // Môn nguy cơ
    const monNguyCo = canhBaoMonNguyCoService(monHocs);
    if (monNguyCo.length > 0) {
      const dsMon = monNguyCo.slice(0, 5).map((m) => `${m.ten} (${m.diemHienTai})`).join(', ');
      parts.push(`⚠️ Môn nguy cơ (<5.0): ${dsMon}`);
    }
  } else {
    parts.push('📊 Chưa có dữ liệu môn học');
  }

  // Deadline
  if (deadlines.length > 0) {
    const dsDeadline = deadlines.map((d) => {
      const ngay = d.hanChot.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
      const mon = d.monHoc?.ten ? ` [${d.monHoc.ten}]` : '';
      const uuTien = d.doUuTien === 'cao' ? ' 🔴' : '';
      return `- ${d.tieuDe}${mon}: ${ngay}${uuTien}`;
    }).join('\n');
    parts.push(`📅 Deadline 7 ngày tới (${deadlines.length}):\n${dsDeadline}`);
  } else {
    parts.push('📅 Không có deadline nào trong 7 ngày tới');
  }

  // Tài chính
  if (giaoDichs.length > 0) {
    const { tongThu, tongChi, soDu } = thongKeTaiChinhService(giaoDichs);
    const thangHienTai = `T${now.getMonth() + 1}/${now.getFullYear()}`;
    parts.push(`💰 Tài chính ${thangHienTai}: Thu ${formatTien(tongThu)} | Chi ${formatTien(tongChi)} | Số dư ${formatTien(soDu)}`);
  } else {
    parts.push('💰 Chưa có giao dịch tháng này');
  }

  // Lịch học hôm nay
  if (lichHoc.length > 0) {
    const dsLich = lichHoc.map((l) => {
      const phong = l.phongHoc ? ` (${l.phongHoc})` : '';
      return `- ${l.gioBatDau}-${l.gioKetThuc}: ${l.tenMon}${phong}`;
    }).join('\n');
    parts.push(`🗓️ Lịch học hôm nay (${tenThu(thuHomNay)}, ${lichHoc.length} tiết):\n${dsLich}`);
  } else {
    parts.push(`🗓️ Hôm nay (${tenThu(thuHomNay)}) không có lịch học`);
  }

  return parts.join('\n\n');
}

module.exports = { layNguCanhSinhVien, layThuTrongTuan, formatTien };
