/**
 * finance.service.js
 * Tầng nghiệp vụ (Service Layer) cho module Tài chính & Ngân sách
 * Tách biệt thuật toán thống kê, kiểm tra ngân sách và xử lý xu hướng khỏi Controller.
 */

const { FINANCE } = require('../../constants');

/**
 * Chống Formula/CSV Injection khi xuất Excel
 * @param {string} chuoi - Chuỗi cần lọc
 * @returns {string} Chuỗi an toàn
 */
function chongCongThuc(chuoi) {
  if (typeof chuoi !== 'string') return chuoi;
  return /^[=+\-@\t\r]/.test(chuoi) ? `'${chuoi}` : chuoi;
}

/**
 * Tính toán thống kê tổng quan tài chính (thu, chi, số dư, cơ cấu theo danh mục)
 * @param {Array} giaoDichs - Danh sách các giao dịch trong tháng
 * @returns {{ tongThu: number, tongChi: number, soDu: number, theoDanhMuc: Object }}
 */
function thongKeTaiChinhService(giaoDichs) {
  let tongThu = 0;
  let tongChi = 0;
  const theoDanhMuc = {};

  giaoDichs.forEach((g) => {
    if (g.loai === 'thu') {
      tongThu += g.soTien;
    } else if (g.loai === 'chi') {
      tongChi += g.soTien;
      theoDanhMuc[g.danhMuc] = (theoDanhMuc[g.danhMuc] || 0) + g.soTien;
    }
  });

  return {
    tongThu,
    tongChi,
    soDu: tongThu - tongChi,
    theoDanhMuc,
  };
}

/**
 * Đối chiếu chi tiêu thực tế với định mức ngân sách đã thiết lập
 * @param {Array} nganSachs - Danh sách ngân sách { id, danhMuc, soTienToiDa }
 * @param {Array} giaoDichsChi - Danh sách giao dịch chi tiêu trong tháng
 * @returns {Array} Danh sách trạng thái ngân sách từng danh mục
 */
function kiemTraNganSachService(nganSachs, giaoDichsChi) {
  // Gom nhóm chi tiêu theo danh mục trước để tránh O(N*M)
  const chiTheoDanhMuc = {};
  giaoDichsChi.forEach((g) => {
    chiTheoDanhMuc[g.danhMuc] = (chiTheoDanhMuc[g.danhMuc] || 0) + g.soTien;
  });

  return nganSachs.map((ns) => {
    const daChi = chiTheoDanhMuc[ns.danhMuc] || 0;
    const conLai = Math.max(0, ns.soTienToiDa - daChi);
    const phanTram = ns.soTienToiDa > 0 ? Math.round((daChi / ns.soTienToiDa) * 100) : 0;
    const vuotNganSach = daChi > ns.soTienToiDa;

    return {
      id: ns.id,
      danhMuc: ns.danhMuc,
      soTienToiDa: ns.soTienToiDa,
      hanMuc: ns.soTienToiDa, // Giữ tương thích ngược với frontend
      daChi,
      conLai,
      phanTram,
      vuotNganSach,
    };
  });
}

/**
 * Tính toán ma trận xu hướng thu - chi - số dư trong N tháng gần nhất
 * @param {Array} giaoDichs - Danh sách giao dịch trong khoảng N tháng
 * @param {number} soThang - Số tháng thống kê (mặc định 6)
 * @param {Date} now - Thời điểm mốc
 * @returns {Array} Mảng các { thang, thu, chi, soDu }
 */
function tinhXuHuongService(giaoDichs, soThang = FINANCE.DEFAULT_TREND_MONTHS, now = new Date()) {
  const cacThang = [];
  for (let i = soThang - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    cacThang.push({
      nhan: `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`,
      nam: d.getFullYear(),
      thang: d.getMonth() + 1,
      thu: 0,
      chi: 0,
    });
  }

  giaoDichs.forEach((g) => {
    const d = new Date(g.ngayGiaoDich);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const mucThang = cacThang.find((t) => t.thang === m && t.nam === y);
    if (mucThang) {
      if (g.loai === 'thu') mucThang.thu += g.soTien;
      else if (g.loai === 'chi') mucThang.chi += g.soTien;
    }
  });

  return cacThang.map((t) => ({
    thang: t.nhan,
    thu: t.thu,
    chi: t.chi,
    soDu: t.thu - t.chi,
  }));
}

module.exports = {
  chongCongThuc,
  thongKeTaiChinhService,
  kiemTraNganSachService,
  tinhXuHuongService,
};
