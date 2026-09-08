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

// Giới hạn gọi Chatbot — API Gemini tính phí theo lượng dùng, cần chặn
// việc gọi lặp lại liên tục (vô tình do bug frontend hoặc cố ý spam).
// 20 tin nhắn / 5 phút / mỗi IP là đủ thoải mái cho 1 phiên chat bình thường.
const gioiHanChatbot = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn nhắn hơi nhanh, vui lòng chờ một chút rồi thử lại.' },
});

// Giới hạn API kích hoạt thủ công cron (test gửi email) — dù đã scope theo
// người dùng, vẫn nên chặn vòng lặp gọi liên tục để tránh spam hộp thư
// chính mình hoặc chạm giới hạn gửi email của nhà cung cấp SMTP.
const gioiHanTestCron = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn đã test quá nhiều lần, vui lòng thử lại sau ít phút.' },
});

module.exports = { gioiHanDangNhap, gioiHanChatbot, gioiHanTestCron };
