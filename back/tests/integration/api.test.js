const request = require('supertest');
const app = require('../../app');
const prisma = require('../../src/prismaClient');

describe('API Integration Tests', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/health', () => {
    test('trả về 200 OK và trạng thái hoạt động của cơ sở dữ liệu', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /', () => {
    test('trả về 200 OK với thông điệp chào mừng', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('Backend đang chạy');
    });
  });

  describe('Authentication Security & Guarding', () => {
    test('từ chối đăng nhập khi thiếu email/mật khẩu (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/dang-nhap')
        .send({});
      expect(res.statusCode).toBe(400);
    });

    test('từ chối đăng nhập với tài khoản không tồn tại (400 / 401)', async () => {
      const res = await request(app)
        .post('/api/auth/dang-nhap')
        .send({
          email: 'nonexistent_test_user_xyz@slh.edu.vn',
          matKhau: 'RandomPass123!@#',
        });
      expect([400, 401]).toContain(res.statusCode);
    });

    test('chặn truy cập tài nguyên bảo mật khi không có JWT token (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/academic/mon-hoc');
      expect(res.statusCode).toBe(401);
    });
  });
});
