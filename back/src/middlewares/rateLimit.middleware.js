const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../constants');

// Giới hạn số lần thử đăng nhập/quên mật khẩu để chống brute-force
const gioiHanDangNhap = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  limit: RATE_LIMIT.AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn đã thử quá nhiều lần, vui lòng thử lại sau ít phút.' },
});

// Giới hạn gọi Chatbot — chặn spam API Gemini
const gioiHanChatbot = rateLimit({
  windowMs: RATE_LIMIT.CHATBOT_WINDOW_MS,
  limit: RATE_LIMIT.CHATBOT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn nhắn hơi nhanh, vui lòng chờ một chút rồi thử lại.' },
});

// Giới hạn API kích hoạt thủ công cron (test gửi email)
const gioiHanTestCron = rateLimit({
  windowMs: RATE_LIMIT.CRON_TEST_WINDOW_MS,
  limit: RATE_LIMIT.CRON_TEST_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn đã test quá nhiều lần, vui lòng thử lại sau ít phút.' },
});

module.exports = { gioiHanDangNhap, gioiHanChatbot, gioiHanTestCron };
