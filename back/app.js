const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// Chỉ tin header X-Forwarded-For khi THẬT SỰ chạy sau 1 lớp reverse proxy
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Đặt các HTTP header bảo mật cơ bản
app.use(helmet());

// Chỉ cho phép đúng domain frontend gọi API
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '500kb' }));

// Rate limiter toàn cục: 300 requests / 15 phút / IP
const gioiHanChung = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', gioiHanChung);

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

// Middleware xử lý lỗi tập trung
app.use((err, req, res, next) => {
  console.error('Lỗi chưa xử lý:', err);
  res.status(500).json({ message: 'Đã có lỗi xảy ra ở server' });
});

// 404 handler cho các route không tồn tại
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Đường dẫn không tồn tại' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  khoiDongCronJobs();
});