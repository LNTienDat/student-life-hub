const rateLimit = require('express-rate-limit');

// Giới hạn số lần thử đăng nhập/quên mật khẩu để chống brute-force —
// 10 lần / 15 phút / mỗi IP, đủ thoải mái cho người dùng thật gõ nhầm
// mật khẩu vài lần, nhưng chặn được tấn công dò mật khẩu tự động.
const gioiHanDangNhap = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn đã thử quá nhiều lần, vui lòng thử lại sau ít phút.' },
});

module.exports = { gioiHanDangNhap };
