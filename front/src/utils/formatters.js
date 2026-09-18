/**
 * formatters.js
 * Tập trung toàn bộ hàm định dạng dữ liệu (tiền tệ, ngày tháng, thời gian)
 * Đồng nhất cách hiển thị trên toàn bộ giao diện Frontend.
 */

/**
 * Định dạng số thành chuỗi tiền tệ Việt Nam Đồng (VND)
 * @param {number} so - Số tiền
 * @returns {string} Chuỗi định dạng ví dụ: "150.000 ₫"
 */
export function dinhDangTien(so) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(so || 0);
}

/**
 * Định dạng chuỗi ngày ISO thành dạng ngày/tháng/năm theo giờ Việt Nam
 * @param {string|Date} ngay - Ngày cần định dạng
 * @param {boolean} coGio - Có kèm theo giờ:phút hay không
 * @returns {string} Chuỗi định dạng ví dụ: "18/09/2026" hoặc "14:30, 18/09/2026"
 */
export function dinhDangNgay(ngay, coGio = false) {
  if (!ngay) return '';
  const d = new Date(ngay);
  if (isNaN(d.getTime())) return '';

  if (coGio) {
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Chuyển chuỗi giờ "HH:mm" thành tổng số phút tính từ 00:00
 * Phục vụ tính toán tọa độ lưới thời khóa biểu
 * @param {string} gioChuoi - Ví dụ: "07:30"
 * @returns {number} Số phút, ví dụ: 450
 */
export function gioSangPhut(gioChuoi) {
  if (!gioChuoi || typeof gioChuoi !== 'string') return 0;
  const [h, m] = gioChuoi.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
