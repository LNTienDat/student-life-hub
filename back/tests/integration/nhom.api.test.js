const { randomUUID } = require('crypto');
const auditEmails = [`nhom-${randomUUID()}@example.invalid`, `nhom-${randomUUID()}@example.invalid`];
const request = require('supertest');
const app = require('../../app');
const prisma = require('../../src/prismaClient');

describe('Nhóm học tập & Chia sẻ TKB API Tests', () => {
  let tokenUser1;
  let tokenUser2;
  let user1;
  let user2;
  let nhomTao;

  beforeAll(async () => {
    const database = new URL(process.env.DATABASE_URL);
    if (!['127.0.0.1', 'localhost', 'postgres'].includes(database.hostname) || !/test|review|audit|bugfix/.test(database.pathname)) throw new Error('Nhóm tests require an isolated test database');

    // Đăng ký và đăng nhập 2 user test
    await request(app).post('/api/auth/dang-ky').send({
      ten: 'Sinh Viên Một',
      email: auditEmails[0],
      matKhau: '123456',
    });
    const resLogin1 = await request(app).post('/api/auth/dang-nhap').send({
      email: auditEmails[0],
      matKhau: '123456',
    });
    tokenUser1 = resLogin1.body.token;
    user1 = resLogin1.body.user;

    await request(app).post('/api/auth/dang-ky').send({
      ten: 'Sinh Viên Hai',
      email: auditEmails[1],
      matKhau: '123456',
    });
    const resLogin2 = await request(app).post('/api/auth/dang-nhap').send({
      email: auditEmails[1],
      matKhau: '123456',
    });
    tokenUser2 = resLogin2.body.token;
    user2 = resLogin2.body.user;
  });

  afterAll(async () => {
    const ids = [user1?.id, user2?.id].filter(Number.isInteger);
    if (ids.length) await prisma.nguoiDung.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });

  describe('1. Nhóm học tập', () => {
    it('User 1 tạo nhóm mới thành công', async () => {
      const res = await request(app)
        .post('/api/nhom/tao')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          ten: 'Nhóm Công Nghệ Phần Mềm',
          moTa: 'Ôn tập đồ án và kiểm thử',
        });

      expect(res.status).toBe(201);
      expect(res.body.nhom).toBeDefined();
      expect(res.body.nhom.ten).toBe('Nhóm Công Nghệ Phần Mềm');
      expect(res.body.nhom.maCode).toHaveLength(6);
      nhomTao = res.body.nhom;
    });

    it('User 2 tham gia nhóm bằng mã mời hợp lệ', async () => {
      const res = await request(app)
        .post('/api/nhom/tham-gia')
        .set('Authorization', `Bearer ${tokenUser2}`)
        .send({
          maCode: nhomTao.maCode,
        });

      expect(res.status).toBe(200);
      expect(res.body.nhomId).toBe(nhomTao.id);
    });

    it('Không cho phép tham gia nhóm lần 2', async () => {
      const res = await request(app)
        .post('/api/nhom/tham-gia')
        .set('Authorization', `Bearer ${tokenUser2}`)
        .send({
          maCode: nhomTao.maCode,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('đã là thành viên');
    });

    it('Lấy chi tiết nhóm bao gồm danh sách thành viên', async () => {
      const res = await request(app)
        .get(`/api/nhom/${nhomTao.id}`)
        .set('Authorization', `Bearer ${tokenUser1}`);

      expect(res.status).toBe(200);
      expect(res.body.nhom.thanhViens).toHaveLength(2);
      expect(res.body.vaiTroCuaBan).toBe('chu_nhom');
    });

    it('Tạo deadline nhóm và tự động sinh bản ghi tiến độ cho các thành viên', async () => {
      const res = await request(app)
        .post(`/api/nhom/${nhomTao.id}/deadline`)
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          tieuDe: 'Nộp báo cáo Sprint 1',
          moTa: 'Hoàn thành file word và gửi thầy',
          hanChot: new Date(Date.now() + 86400000 * 3).toISOString(),
          doUuTien: 'cao',
        });

      expect(res.status).toBe(201);
      expect(res.body.deadline).toBeDefined();
      expect(res.body.deadline.tienDos).toHaveLength(2);
    });

    it('User 2 cập nhật tiến độ của mình cho deadline nhóm', async () => {
      // Lấy chi tiết nhóm để lấy id deadline vừa tạo
      const detailRes = await request(app)
        .get(`/api/nhom/${nhomTao.id}`)
        .set('Authorization', `Bearer ${tokenUser2}`);

      const deadline = detailRes.body.nhom.deadlineNhoms[0];

      const res = await request(app)
        .put(`/api/nhom/${nhomTao.id}/deadline/${deadline.id}/tien-do`)
        .set('Authorization', `Bearer ${tokenUser2}`)
        .send({
          trangThai: 'hoan_thanh',
          ghiChu: 'Đã hoàn tất phần test case',
        });

      expect(res.status).toBe(200);
      expect(res.body.tienDo.trangThai).toBe('hoan_thanh');
      expect(res.body.tienDo.ghiChu).toBe('Đã hoàn tất phần test case');
    });
  });

  describe('2. Chia sẻ Thời khóa biểu (Public share)', () => {
    it('Bật chia sẻ thời khóa biểu tạo shareToken duy nhất', async () => {
      const res = await request(app)
        .post('/api/thoi-khoa-bieu/share/bat')
        .set('Authorization', `Bearer ${tokenUser1}`);

      expect(res.status).toBe(200);
      expect(res.body.shareEnabled).toBe(true);
      expect(res.body.shareToken).toBeDefined();

      const shareToken = res.body.shareToken;

      // Thêm 1 buổi học vào TKB của User 1
      await request(app)
        .post('/api/thoi-khoa-bieu')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          tenMon: 'Lập trình Web nâng cao',
          thu: 3,
          gioBatDau: '07:30',
          gioKetThuc: '10:00',
          phongHoc: 'A1-205',
        });

      // Xem TKB dạng PUBLIC (không cần header Authorization)
      const publicRes = await request(app).get(`/api/thoi-khoa-bieu/share/public/${shareToken}`);
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.chuSoHuu.ten).toBe('Sinh Viên Một');
      expect(publicRes.body.thoiKhoaBieu).toHaveLength(1);
      expect(publicRes.body.thoiKhoaBieu[0].tenMon).toBe('Lập trình Web nâng cao');
    });

    it('Tắt chia sẻ thì link public sẽ trả về 404', async () => {
      const statusRes = await request(app)
        .get('/api/thoi-khoa-bieu/share/trang-thai')
        .set('Authorization', `Bearer ${tokenUser1}`);

      const token = statusRes.body.shareToken;

      // Tắt chia sẻ
      await request(app)
        .post('/api/thoi-khoa-bieu/share/tat')
        .set('Authorization', `Bearer ${tokenUser1}`);

      // Thử xem public bằng token cũ
      const publicRes = await request(app).get(`/api/thoi-khoa-bieu/share/public/${token}`);
      expect(publicRes.status).toBe(404);
    });
  });
});
