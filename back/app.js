const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();
const { deploymentConfig } = require('./src/deployment');
const deployment = deploymentConfig(process.env);
if (!process.env.FRONTEND_URL) process.env.FRONTEND_URL = deployment.frontendUrl;
const path = require('path');
const { mountFrontend } = require('./src/serveFrontend');

const authRoutes = require('./src/modules/auth/auth.routes');
const academicRoutes = require('./src/modules/academic/academic.routes');
const deadlineRoutes = require('./src/modules/deadline/deadline.routes');
const financeRoutes = require('./src/modules/finance/finance.routes');
const thoiKhoaBieuRoutes = require('./src/modules/thoikhoabieu/thoikhoabieu.routes');
const thongBaoRoutes = require('./src/modules/thongbao/thongbao.routes');
const chatbotRoutes = require('./src/modules/chatbot/chatbot.routes');
const { khoiDongCronJobs } = require('./src/cron/thongBao.cron');
const prisma = require('./src/prismaClient');

const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./src/docs/swagger.json');

const { RATE_LIMIT } = require('./src/constants');

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

app.use(compression());
app.use('/api/imports', express.json({ limit: '2mb' }));
app.use(express.json({ limit: '500kb' }));

// Rate limiter toàn cục
const gioiHanChung = rateLimit({
  windowMs: RATE_LIMIT.GLOBAL_WINDOW_MS,
  max: RATE_LIMIT.GLOBAL_MAX,
  message: { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', gioiHanChung);

// Health check endpoint phục vụ Docker / Render / UptimeRobot
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ message: 'Database connection failed' });
  }
});

if (!deployment.serveFrontend) {
  app.get('/', (req, res) => res.send('Backend đang chạy ngon lành!'));
}

// Swagger UI - Tài liệu API tương tác
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.use('/api/auth', authRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/deadline', deadlineRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/thoi-khoa-bieu', thoiKhoaBieuRoutes);
app.use('/api/thong-bao', thongBaoRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/imports', require('./src/modules/imports/import.routes'));

// 404 handler cho các route API không tồn tại
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Đường dẫn không tồn tại' });
  }
  next();
});

// Middleware xử lý lỗi tập trung
if (deployment.serveFrontend) mountFrontend(app, path.resolve(__dirname, '../front/dist'));

// Missing static files must be a real 404, never an HTML response for a service worker.
app.use((req, res) => res.status(404).json({ message: 'Đường dẫn không tồn tại' }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Tệp quá lớn. Tối đa 1 MB.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Dữ liệu gửi lên không hợp lệ.' });
  console.error('Lỗi chưa xử lý:', err);
  res.status(500).json({ message: 'Đã có lỗi xảy ra ở server' });
});

let server;
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
    if (deployment.enableCron) khoiDongCronJobs();
  });
}

// Đóng tắt êm (graceful shutdown) — khi hosting/Docker gửi tín hiệu dừng
// (VD: trước khi deploy bản mới), dừng nhận request mới, để request đang
// dở hoàn tất, rồi mới đóng kết nối database sạch sẽ. Không có bước này,
// process có thể bị ngắt đột ngột giữa chừng 1 request hoặc để lại kết nối
// DB không đóng đúng cách.
function tatEm(tinHieu) {
  console.log(`[Shutdown] Nhận tín hiệu ${tinHieu}, đang đóng server êm...`);
  if (server) {
    server.close(async () => {
      try {
        await prisma.$disconnect();
        console.log('[Shutdown] Đã đóng server và ngắt kết nối database.');
      } catch (err) {
        console.error('[Shutdown] Lỗi khi ngắt kết nối database:', err);
      } finally {
        process.exit(0);
      }
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => tatEm('SIGTERM'));
process.on('SIGINT', () => tatEm('SIGINT'));

// Lớp bảo vệ cuối cùng ở cấp process — khác với middleware lỗi Express ở
// trên (chỉ bắt lỗi xảy ra trong vòng đời request/response), 2 handler này
// bắt lỗi xảy ra NGOÀI luồng HTTP (VD: lỗi sâu bên trong thư viện bên thứ 3
// như Prisma/nodemailer/node-cron). Node hiện đại (v15+) mặc định CRASH
// toàn bộ process với bất kỳ unhandledRejection nào — nếu không bắt, cả
// server sập hoàn toàn dù lỗi chỉ liên quan 1 tác vụ nhỏ.
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
  // uncaughtException để lại process ở trạng thái không rõ ràng — thoát có
  // kiểm soát để trình quản lý tiến trình (PM2, Docker, hosting...) tự khởi
  // động lại sạch, thay vì tiếp tục chạy ngầm ở trạng thái có thể đã hỏng.
  process.exit(1);
});

module.exports = app;
