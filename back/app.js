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

// Chỉ tin header X-Forwarded-For khi THẬT SỰ chạy sau 1 lớp reverse proxy
// (Render, Railway, Heroku, nginx...) — set TRUST_PROXY=true trong .env khi
// deploy. TUYỆT ĐỐI không bật khi chạy local/không có proxy thật ở giữa:
// nếu không có proxy mà vẫn bật, bất kỳ ai cũng tự giả mạo header này để
// "đội lốt" IP ngẫu nhiên, vô hiệu hóa hoàn toàn rate-limit chống brute-force.
// Ngược lại, deploy sau proxy thật mà KHÔNG bật thì mọi người dùng bị coi là
// chung 1 IP (IP của proxy), khiến rate-limit áp dụng nhầm cho tất cả mọi
// người thay vì từng người riêng lẻ.
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Đặt các HTTP header bảo mật cơ bản (chặn MIME-sniffing, ẩn X-Powered-By, v.v.)
app.use(helmet());

// Chỉ cho phép đúng domain frontend gọi API, thay vì mở cho mọi nơi (cors() mặc định)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '500kb' }));

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  khoiDongCronJobs();
});