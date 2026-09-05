const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./src/modules/auth/auth.routes');
const academicRoutes = require('./src/modules/academic/academic.routes');
const deadlineRoutes = require('./src/modules/deadline/deadline.routes');
const financeRoutes = require('./src/modules/finance/finance.routes');
const thoiKhoaBieuRoutes = require('./src/modules/thoikhoabieu/thoikhoabieu.routes');
const thongBaoRoutes = require('./src/modules/thongbao/thongbao.routes');
const chatbotRoutes = require('./src/modules/chatbot/chatbot.routes');
const { khoiDongCronJobs } = require('./src/cron/thongBao.cron');

const app = express();

// Đặt các HTTP header bảo mật cơ bản (chặn MIME-sniffing, ẩn X-Powered-By, v.v.)
app.use(helmet());

// Chỉ cho phép đúng domain frontend gọi API, thay vì mở cho mọi nơi (cors() mặc định)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend đang chạy ngon lành!');
});

app.use('/api/auth', authRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/deadline', deadlineRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/thoi-khoa-bieu', thoiKhoaBieuRoutes);
app.use('/api/thong-bao', thongBaoRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Middleware xử lý lỗi tập trung — bắt mọi lỗi chưa được try/catch trong
// controller (kể cả lỗi bất đồng bộ, Express 5 tự forward về đây), tránh
// stack trace bị lộ ra ngoài và tránh server crash không rõ nguyên nhân.
app.use((err, req, res, next) => {
  console.error('Lỗi chưa xử lý:', err);
  res.status(500).json({ message: 'Đã có lỗi xảy ra ở server' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  khoiDongCronJobs();
});