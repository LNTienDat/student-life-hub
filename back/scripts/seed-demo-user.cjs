const prisma = require('../src/prismaClient');
const { addDocument } = require('../src/modules/rag/document.service');

const TARGET_EMAIL = process.argv[2] || 'suaconcho2595@gmail.com';
const CURRENT_SEMESTER = 'HK2-2024';
const PREV_SEMESTER = 'HK1-2024';

async function seedDemoUser() {
  const user = await prisma.nguoiDung.findUnique({
    where: { email: TARGET_EMAIL },
  });

  if (!user) {
    throw new Error(`Không tìm thấy tài khoản với email: ${TARGET_EMAIL}`);
  }

  const userId = user.id;
  console.log(`Đang tạo dữ liệu mẫu cho tài khoản: ${user.ten} (${user.email}, ID=${userId})...`);

  // 1. Cập nhật thông tin hồ sơ & danh sách học kỳ
  const existingSemesters = Array.isArray(user.hocKyDaLuu) ? user.hocKyDaLuu : [];
  const mergedSemesters = Array.from(new Set([PREV_SEMESTER, CURRENT_SEMESTER, ...existingSemesters]));

  await prisma.nguoiDung.update({
    where: { id: userId },
    data: {
      truong: 'Đại học Công nghệ Thông tin',
      nganh: 'Khoa học Máy tính & AI',
      khoaHoc: 'K2023 - K2027',
      hocKyHienTai: CURRENT_SEMESTER,
      hocKyDaLuu: mergedSemesters,
    },
  });

  // 2. Chuẩn hóa Thời khóa biểu HK2-2024 (sửa lỗi chính tả OCR cũ nếu có)
  await prisma.thoiKhoaBieu.deleteMany({
    where: { idNguoiDung: userId, hocKy: CURRENT_SEMESTER },
  });

  const timetableEntries = [
    {
      tenMon: 'Lập trình Python',
      thu: 2,
      gioBatDau: '13:00',
      gioKetThuc: '17:15',
      phongHoc: 'I3-01 (Phòng máy 1)',
      giangVien: 'ThS. Đặng Mạnh Huy',
      hocKy: CURRENT_SEMESTER,
    },
    {
      tenMon: 'Chuyển đổi số',
      thu: 3,
      gioBatDau: '13:00',
      gioKetThuc: '17:15',
      phongHoc: 'I2-03',
      giangVien: 'ThS. Trương Thành Thảo',
      hocKy: CURRENT_SEMESTER,
    },
    {
      tenMon: 'Phương pháp nghiên cứu và viết báo cáo khoa học',
      thu: 5,
      gioBatDau: '07:00',
      gioKetThuc: '11:15',
      phongHoc: 'I5-06 (Phòng máy 18)',
      giangVien: 'TS. Ngô Hồ Anh Khôi',
      hocKy: CURRENT_SEMESTER,
    },
    {
      tenMon: 'Kỹ năng nghề nghiệp',
      thu: 5,
      gioBatDau: '13:00',
      gioKetThuc: '17:15',
      phongHoc: 'I4-02',
      giangVien: 'GV. Bùi Thị Diễm Trinh',
      hocKy: CURRENT_SEMESTER,
    },
    {
      tenMon: 'Xử lý ảnh',
      thu: 6,
      gioBatDau: '07:00',
      gioKetThuc: '11:15',
      phongHoc: 'I2-04 (Phòng máy tính)',
      giangVien: 'ThS. Phạm Yến Nhi',
      hocKy: CURRENT_SEMESTER,
    },
    {
      tenMon: 'Ngôn ngữ mô hình hóa UML',
      thu: 6,
      gioBatDau: '18:05',
      gioKetThuc: '21:15',
      phongHoc: 'I5-01 (Phòng máy 13)',
      giangVien: 'ThS. Lê Thanh Trúc',
      hocKy: CURRENT_SEMESTER,
    },
    {
      tenMon: 'Điện toán đám mây - Thực hành',
      thu: 7,
      gioBatDau: '13:00',
      gioKetThuc: '17:15',
      phongHoc: 'I5-01 (Phòng máy 13)',
      giangVien: 'ThS. Võ Thanh Vinh',
      hocKy: CURRENT_SEMESTER,
    },
  ];

  for (const item of timetableEntries) {
    await prisma.thoiKhoaBieu.create({
      data: { ...item, idNguoiDung: userId },
    });
  }

  // 3. Tạo Môn học & Điểm thành phần (HK1-2024 đã xong + HK2-2024 đang học để test What-If GPA Simulator)
  await prisma.monHoc.deleteMany({
    where: { idNguoiDung: userId, hocKy: { in: [PREV_SEMESTER, CURRENT_SEMESTER] } },
  });

  const subjectsData = [
    // HK1-2024 (Đã hoàn thành 100%)
    {
      ten: 'Cấu trúc dữ liệu và Giải thuật',
      tinChi: 3,
      hocKy: PREV_SEMESTER,
      diems: [
        { loaiDanhGia: 'Chuyên cần', diem: 9.0, trongSo: 10 },
        { loaiDanhGia: 'Giữa kỳ', diem: 8.5, trongSo: 30 },
        { loaiDanhGia: 'Cuối kỳ', diem: 8.0, trongSo: 60 },
      ],
    },
    {
      ten: 'Hệ quản trị Cơ sở dữ liệu',
      tinChi: 3,
      hocKy: PREV_SEMESTER,
      diems: [
        { loaiDanhGia: 'Chuyên cần', diem: 9.5, trongSo: 10 },
        { loaiDanhGia: 'Giữa kỳ', diem: 8.0, trongSo: 30 },
        { loaiDanhGia: 'Cuối kỳ', diem: 8.5, trongSo: 60 },
      ],
    },
    {
      ten: 'Mạng máy tính',
      tinChi: 3,
      hocKy: PREV_SEMESTER,
      diems: [
        { loaiDanhGia: 'Chuyên cần', diem: 8.0, trongSo: 10 },
        { loaiDanhGia: 'Giữa kỳ', diem: 7.5, trongSo: 30 },
        { loaiDanhGia: 'Cuối kỳ', diem: 7.2, trongSo: 60 },
      ],
    },
    // HK2-2024 (Học kỳ hiện tại - có môn đủ điểm, có môn đang học giữa kỳ để test Giả lập GPA What-If)
    {
      ten: 'Lập trình Python',
      tinChi: 3,
      hocKy: CURRENT_SEMESTER,
      diems: [
        { loaiDanhGia: 'Chuyên cần', diem: 9.5, trongSo: 10 },
        { loaiDanhGia: 'Thực hành Lab', diem: 8.8, trongSo: 20 },
        { loaiDanhGia: 'Giữa kỳ', diem: 8.2, trongSo: 20 },
      ],
    },
    {
      ten: 'Xử lý ảnh',
      tinChi: 3,
      hocKy: CURRENT_SEMESTER,
      diems: [
        { loaiDanhGia: 'Chuyên cần', diem: 9.0, trongSo: 10 },
        { loaiDanhGia: 'Bài tập thực hành', diem: 8.5, trongSo: 20 },
        { loaiDanhGia: 'Giữa kỳ', diem: 7.8, trongSo: 20 },
      ],
    },
    {
      ten: 'Ngôn ngữ mô hình hóa UML',
      tinChi: 3,
      hocKy: CURRENT_SEMESTER,
      diems: [
        { loaiDanhGia: 'Chuyên cần', diem: 9.0, trongSo: 10 },
        { loaiDanhGia: 'Giữa kỳ', diem: 8.0, trongSo: 30 },
        { loaiDanhGia: 'Đồ án môn học', diem: 8.6, trongSo: 60 },
      ],
    },
    {
      ten: 'Điện toán đám mây - Thực hành',
      tinChi: 2,
      hocKy: CURRENT_SEMESTER,
      diems: [
        { loaiDanhGia: 'Chuyên cần', diem: 10.0, trongSo: 20 },
        { loaiDanhGia: 'Bài Lab Docker & Cloud', diem: 8.5, trongSo: 30 },
      ],
    },
    {
      ten: 'Phương pháp nghiên cứu và viết báo cáo khoa học',
      tinChi: 2,
      hocKy: CURRENT_SEMESTER,
      diems: [
        { loaiDanhGia: 'Chuyên cần', diem: 9.0, trongSo: 20 },
        { loaiDanhGia: 'Tiểu luận giữa kỳ', diem: 8.2, trongSo: 30 },
        { loaiDanhGia: 'Báo cáo cuối kỳ', diem: 8.5, trongSo: 50 },
      ],
    },
    {
      ten: 'Kỹ năng nghề nghiệp',
      tinChi: 2,
      hocKy: CURRENT_SEMESTER,
      diems: [
        { loaiDanhGia: 'Chuyên cần', diem: 9.5, trongSo: 20 },
        { loaiDanhGia: 'Thuyết trình nhóm', diem: 9.0, trongSo: 30 },
        { loaiDanhGia: 'Hồ sơ CV & Phỏng vấn', diem: 8.8, trongSo: 50 },
      ],
    },
    {
      ten: 'Chuyển đổi số',
      tinChi: 2,
      hocKy: CURRENT_SEMESTER,
      diems: [
        { loaiDanhGia: 'Chuyên cần', diem: 8.5, trongSo: 20 },
        { loaiDanhGia: 'Giữa kỳ', diem: 7.8, trongSo: 30 },
      ],
    },
  ];

  const createdSubjectsByName = {};
  for (const subj of subjectsData) {
    const created = await prisma.monHoc.create({
      data: {
        idNguoiDung: userId,
        ten: subj.ten,
        tinChi: subj.tinChi,
        hocKy: subj.hocKy,
        trangThai: 'active',
        diems: {
          create: subj.diems,
        },
      },
    });
    createdSubjectsByName[subj.ten] = created;
  }

  // 4. Tạo Deadlines (Phục vụ test Neuro-Symbolic AI Study Planner & trang Deadline)
  await prisma.deadline.deleteMany({
    where: { idNguoiDung: userId },
  });

  const now = new Date();
  const addDays = (days, hour = 16) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + days);
    d.setUTCHours(hour, 0, 0, 0);
    return d;
  };

  const deadlinesData = [
    {
      tieuDe: 'Nộp đồ án Xử lý ảnh: Nhận diện biển số xe bằng OpenCV & CNN',
      moTa: 'Hoàn thiện pipeline tiền xử lý ảnh, tách ký tự và báo cáo kết quả độ chính xác trên tập test.',
      hanChot: addDays(2, 16),
      doUuTien: 'cao',
      trangThai: 'dang_dien_hanh',
      idMonHoc: createdSubjectsByName['Xử lý ảnh']?.id || null,
      checklist: [
        { id: 'c1', text: 'Tiền xử lý ảnh & lọc nhiễu Gaussian', done: true },
        { id: 'c2', text: 'Huấn luyện & đánh giá mô hình nhận diện ký tự', done: false },
        { id: 'c3', text: 'Quay video demo & xuất slide báo cáo', done: false },
      ],
    },
    {
      tieuDe: 'Giải 20 câu hỏi ôn tập Chương 1 - 6 môn Lập trình Python',
      moTa: 'Ôn tập cú pháp mô-đun math, random, os, datetime và lập trình hướng đối tượng chuẩn bị kiểm tra.',
      hanChot: addDays(3, 15),
      doUuTien: 'cao',
      trangThai: 'dang_dien_hanh',
      idMonHoc: createdSubjectsByName['Lập trình Python']?.id || null,
      checklist: [
        { id: 'p1', text: 'Hoàn thành bộ câu hỏi Chương 1 - 3', done: true },
        { id: 'p2', text: 'Code bài tập thực hành Chương 4 - 6', done: false },
      ],
    },
    {
      tieuDe: 'Đặc tả Use Case & vẽ Sequence Diagram hệ thống Student Life Hub',
      moTa: 'Hoàn thiện sơ đồ Class Diagram và Activity Diagram cho báo cáo môn UML.',
      hanChot: addDays(5, 14),
      doUuTien: 'binh_thuong',
      trangThai: 'dang_dien_hanh',
      idMonHoc: createdSubjectsByName['Ngôn ngữ mô hình hóa UML']?.id || null,
      checklist: [
        { id: 'u1', text: 'Vẽ Use Case tổng quát và phân rã', done: true },
        { id: 'u2', text: 'Vẽ 5 Sequence Diagram cho các luồng AI chính', done: true },
        { id: 'u3', text: 'Kiểm tra tính nhất quán với Class Diagram', done: false },
      ],
    },
    {
      tieuDe: 'Deploy kiến trúc Docker & CI/CD lên đám mây Render',
      moTa: 'Cấu hình Dockerfile, biến môi trường bảo mật và kiểm tra health check tự động.',
      hanChot: addDays(7, 16),
      doUuTien: 'cao',
      trangThai: 'dang_dien_hanh',
      idMonHoc: createdSubjectsByName['Điện toán đám mây - Thực hành']?.id || null,
      checklist: [
        { id: 'd1', text: 'Viết Dockerfile cho Backend & Frontend', done: true },
        { id: 'd2', text: 'Cấu hình PostgreSQL & kiểm thử API health', done: false },
      ],
    },
    {
      tieuDe: 'Viết phần Tổng quan tài liệu (Literature Review) bài báo khoa học',
      moTa: 'Tổng hợp 10 tài liệu tham khảo IEEE/ACM về ứng dụng Neuro-Symbolic AI và RAG trong giáo dục.',
      hanChot: addDays(10, 10),
      doUuTien: 'binh_thuong',
      trangThai: 'dang_dien_hanh',
      idMonHoc: createdSubjectsByName['Phương pháp nghiên cứu và viết báo cáo khoa học']?.id || null,
      checklist: [],
    },
    {
      tieuDe: 'Chuẩn bị slide thuyết trình Chuyển đổi số trong giáo dục đại học',
      moTa: 'Phân tích case study ứng dụng AI Agent và EdgeAI hỗ trợ sinh viên.',
      hanChot: addDays(13, 12),
      doUuTien: 'thap',
      trangThai: 'dang_dien_hanh',
      idMonHoc: createdSubjectsByName['Chuyển đổi số']?.id || null,
      checklist: [],
    },
    {
      tieuDe: 'Nộp CV cá nhân & Portfolio GitHub môn Kỹ năng nghề nghiệp',
      moTa: 'Đã nộp đúng hạn và được giảng viên duyệt.',
      hanChot: addDays(-4, 10),
      doUuTien: 'binh_thuong',
      trangThai: 'hoan_thanh',
      hoanThanhLuc: addDays(-5, 14),
      idMonHoc: createdSubjectsByName['Kỹ năng nghề nghiệp']?.id || null,
      checklist: [
        { id: 'k1', text: 'Cập nhật dự án Student Life Hub vào CV', done: true },
        { id: 'k2', text: 'Đính kèm link repo GitHub', done: true },
      ],
    },
  ];

  for (const dl of deadlinesData) {
    await prisma.deadline.create({
      data: { ...dl, idNguoiDung: userId },
    });
  }

  // 5. Tạo Ngân sách & Giao dịch Tài chính (Có giao dịch thường ngày + 1 giao dịch đột biến để test Phát hiện bất thường)
  await prisma.nganSach.deleteMany({
    where: { idNguoiDung: userId, thang: 11, nam: 2026 },
  });

  const budgetsNov2026 = [
    { danhMuc: 'an_uong', soTienToiDa: 1800000, thang: 11, nam: 2026 },
    { danhMuc: 'di_lai', soTienToiDa: 500000, thang: 11, nam: 2026 },
    { danhMuc: 'hoc_phi', soTienToiDa: 2200000, thang: 11, nam: 2026 },
    { danhMuc: 'giai_tri', soTienToiDa: 600000, thang: 11, nam: 2026 },
    { danhMuc: 'tro', soTienToiDa: 1200000, thang: 11, nam: 2026 },
  ];

  for (const b of budgetsNov2026) {
    await prisma.nganSach.create({
      data: { ...b, idNguoiDung: userId },
    });
  }

  // Xóa các giao dịch mẫu cũ của tháng 10 & 11/2026 (hoặc mã danh mục cũ không chuẩn) để nạp bộ giao dịch chuẩn
  await prisma.giaoDich.deleteMany({
    where: {
      idNguoiDung: userId,
      OR: [
        {
          ngayGiaoDich: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lte: new Date('2026-11-30T23:59:59.000Z'),
          },
        },
        {
          danhMuc: { in: ['hoc_tap', 'sinh_hoat', 'gia_dinh', 'luong_part_time'] },
        },
      ],
    },
  });

  const transactionsData = [
    // Tháng 10/2026 (Để test tra cứu lịch sử nhiều tháng & biểu đồ xu hướng)
    { loai: 'thu', danhMuc: 'hoc_bong', soTien: 2000000, moTa: 'Học bổng khuyến khích học tập', ngayGiaoDich: new Date('2026-10-05T08:00:00.000Z') },
    { loai: 'thu', danhMuc: 'tro_cap', soTien: 4000000, moTa: 'Gia đình gửi tiền sinh hoạt tháng 10', ngayGiaoDich: new Date('2026-10-02T09:00:00.000Z') },
    { loai: 'chi', danhMuc: 'tro', soTien: 1200000, moTa: 'Tiền phòng KTX & điện nước tháng 10', ngayGiaoDich: new Date('2026-10-06T10:00:00.000Z') },
    { loai: 'chi', danhMuc: 'an_uong', soTien: 450000, moTa: 'Đi siêu thị Co.opmart mua đồ ăn tuần', ngayGiaoDich: new Date('2026-10-12T11:30:00.000Z') },
    { loai: 'chi', danhMuc: 'hoc_phi', soTien: 280000, moTa: 'Mua sách giáo trình Xử lý ảnh & Python', ngayGiaoDich: new Date('2026-10-18T14:20:00.000Z') },
    { loai: 'chi', danhMuc: 'di_lai', soTien: 150000, moTa: 'Đổ xăng & vé xe buýt tháng 10', ngayGiaoDich: new Date('2026-10-25T16:00:00.000Z') },

    // Tháng 11/2026 (Chuỗi chi tiêu đều đặn ~40k-95k/lần + 1 khoản chi đột biến để kích hoạt cảnh báo bất thường)
    { loai: 'thu', danhMuc: 'tro_cap', soTien: 4500000, moTa: 'Trợ cấp sinh hoạt gia đình tháng 11', ngayGiaoDich: new Date('2026-11-01T08:30:00.000Z') },
    { loai: 'thu', danhMuc: 'luong', soTien: 1800000, moTa: 'Thù lao trợ giảng phòng Lab Python', ngayGiaoDich: new Date('2026-11-10T09:15:00.000Z') },
    { loai: 'chi', danhMuc: 'an_uong', soTien: 45000, moTa: 'Cơm tấm sườn bì chả buổi trưa', ngayGiaoDich: new Date('2026-11-02T05:15:00.000Z') },
    { loai: 'chi', danhMuc: 'di_lai', soTien: 70000, moTa: 'Đổ xăng RON 95 Petrolimex', ngayGiaoDich: new Date('2026-11-03T10:20:00.000Z') },
    { loai: 'chi', danhMuc: 'an_uong', soTien: 55000, moTa: 'Bún bò Huế & trà đá căn tin', ngayGiaoDich: new Date('2026-11-05T05:30:00.000Z') },
    { loai: 'chi', danhMuc: 'hoc_phi', soTien: 65000, moTa: 'In ấn đề cương ôn tập & đóng bìa báo cáo', ngayGiaoDich: new Date('2026-11-07T08:00:00.000Z') },
    { loai: 'chi', danhMuc: 'giai_tri', soTien: 95000, moTa: 'Vé xem phim CGV cuối tuần', ngayGiaoDich: new Date('2026-11-08T13:00:00.000Z') },
    { loai: 'chi', danhMuc: 'an_uong', soTien: 48000, moTa: 'Trà sữa Phúc Long học nhóm', ngayGiaoDich: new Date('2026-11-10T07:45:00.000Z') },
    { loai: 'chi', danhMuc: 'tro', soTien: 85000, moTa: 'Mua nước giặt & đồ dùng cá nhân', ngayGiaoDich: new Date('2026-11-12T11:00:00.000Z') },
    { loai: 'chi', danhMuc: 'an_uong', soTien: 60000, moTa: 'Cơm gà xối mỡ & nước cam', ngayGiaoDich: new Date('2026-11-14T05:20:00.000Z') },
    { loai: 'chi', danhMuc: 'di_lai', soTien: 80000, moTa: 'Đổ xăng đi học tuần mới', ngayGiaoDich: new Date('2026-11-16T01:30:00.000Z') },
    { loai: 'chi', danhMuc: 'an_uong', soTien: 50000, moTa: 'Phở bò tái nạm buổi sáng', ngayGiaoDich: new Date('2026-11-18T01:15:00.000Z') },
    { loai: 'chi', danhMuc: 'giai_tri', soTien: 59000, moTa: 'Gia hạn gói Spotify Student', ngayGiaoDich: new Date('2026-11-19T09:00:00.000Z') },
    { loai: 'chi', danhMuc: 'an_uong', soTien: 45000, moTa: 'Mua bánh mì & cà phê sữa sáng nay', ngayGiaoDich: new Date('2026-11-21T01:30:00.000Z') },
    { loai: 'chi', danhMuc: 'di_lai', soTien: 30000, moTa: 'Vé gửi xe tháng tại trường', ngayGiaoDich: new Date('2026-11-21T04:00:00.000Z') },
    // Khoản chi đột biến (Outlier) để test phát hiện bất thường
    { loai: 'chi', danhMuc: 'hoc_phi', soTien: 1850000, moTa: 'Nâng cấp RAM 16GB & ổ cứng SSD NVMe phục vụ chạy mô hình AI', ngayGiaoDich: new Date('2026-11-20T09:30:00.000Z') },
  ];

  for (const tx of transactionsData) {
    await prisma.giaoDich.create({
      data: { ...tx, idNguoiDung: userId },
    });
  }

  // 6. Thêm Tài liệu học tập RAG chuẩn để test RAG Auto-Quiz & SM-2 Spaced Repetition
  const sampleDocTitle = 'Đề cương ôn tập Lập trình Python & Xử lý ảnh (Chương 1 - 3)';
  const existingDoc = await prisma.taiLieuRag.findFirst({
    where: { idNguoiDung: userId, tieuDe: sampleDocTitle },
  });

  if (!existingDoc) {
    const sampleDocContent = [
      'CHƯƠNG 1: TỔNG QUAN VỀ NGÔN NGỮ LẬP TRÌNH PYTHON',
      'Câu 1: Trình bày khái niệm chương trình dịch và vai trò của nó trong lập trình.',
      'Đáp án: Chương trình dịch là phần mềm chuyển đổi mã nguồn viết bằng ngôn ngữ lập trình bậc cao sang ngôn ngữ máy. Vai trò chính là giúp máy tính hiểu và thực thi lệnh, đồng thời phát hiện lỗi cú pháp.',
      'Câu 2: Phân biệt giữa trình biên dịch (Compiler) và trình thông dịch (Interpreter).',
      'Đáp án: Trình biên dịch dịch toàn bộ chương trình sang mã máy trước khi chạy (ví dụ C/C++), trong khi trình thông dịch dịch và thực thi từng dòng lệnh trực tiếp (ví dụ Python, JavaScript).',
      'Câu 3: Để làm việc với các hàm toán học như sqrt(), pow(), exp() trong Python cần nạp mô-đun nào?',
      'Đáp án: Cần sử dụng lệnh import math để nạp mô-đun toán học tiêu chuẩn của Python.',
      'Câu 4: Mô-đun nào trong Python dùng để sinh số ngẫu nhiên như random(), gauss(), randrange()?',
      'Đáp án: Mô-đun random được sử dụng để sinh các số giả ngẫu nhiên và lấy mẫu ngẫu nhiên.',
      'Câu 5: Cách sử dụng mô-đun os để tương tác với hệ điều hành trong Python là gì?',
      'Đáp án: Dùng lệnh import os, sau đó gọi các hàm như os.getcwd() để lấy thư mục hiện hành hoặc os.mkdir() để tạo thư mục mới.',
      'Câu 6: Giấy phép phát triển của Python là gì?',
      'Đáp án: Python được phát triển theo giấy phép PSFL (Python Software Foundation License) do tổ chức OSI phê duyệt, cho phép sử dụng miễn phí cho cả mục đích học tập và thương mại.',
      '',
      'CHƯƠNG 2: CƠ SỞ XỬ LÝ ẢNH SỐ VÀ THỊ GIÁC MÁY TÍNH',
      'Khái niệm Bộ lọc Gaussian (Gaussian Blur): Là phép tích chập sử dụng mặt nạ phân phối chuẩn Gaussian nhằm làm mờ ảnh và giảm nhiễu tần số cao trước khi tách biên.',
      'Khái niệm Thuật toán Canny Edge Detection: Là thuật toán phát hiện biên đa giai đoạn gồm làm trơn bằng Gaussian, tính gradient cường độ sáng, triệt tiêu phi cực đại (Non-maximum suppression) và ngưỡng trễ kép (Double thresholding).',
      'Khái niệm Biểu đồ mức xám (Histogram Equalization): Là kỹ thuật cân bằng lược đồ xám giúp tăng cường độ tương phản toàn cục của ảnh bằng cách trải đều phân bố cường độ điểm ảnh.',
    ].join('\n');

    try {
      await addDocument(userId, {
        tieuDe: sampleDocTitle,
        noiDung: sampleDocContent,
      });
    } catch (err) {
      console.warn('Bỏ qua tạo tài liệu RAG nếu đã tồn tại nội dung:', err.message);
    }
  }

  // 7. Tạo Nhóm học tập & Deadline nhóm mẫu
  const groupCode = 'SLH-AI2026';
  let group = await prisma.nhomHocTap.findUnique({ where: { maCode: groupCode } });
  if (!group) {
    group = await prisma.nhomHocTap.create({
      data: {
        ten: 'Nhóm Đồ Án Cơ Sở 2 - AI & Cloud',
        moTa: 'Nhóm nghiên cứu và phát triển hệ thống Student Life Hub tích hợp Neuro-Symbolic AI, EdgeAI, RAG & SM-2.',
        maCode: groupCode,
        idChuNhom: userId,
        thanhViens: {
          create: {
            idNguoiDung: userId,
            vaiTro: 'chu_nhom',
          },
        },
      },
    });

    await prisma.deadlineNhom.create({
      data: {
        idNhom: group.id,
        idNguoiTao: userId,
        tieuDe: 'Tổng duyệt slide bảo vệ Đồ Án Cơ Sở 2 & chạy thử 5 công nghệ AI',
        moTa: 'Kiểm tra toàn bộ kịch bản demo Neuro-Symbolic Planner, EdgeAI Offline, Voice Agent, RAG SM-2 và GPA Simulator.',
        hanChot: addDays(4, 14),
        doUuTien: 'cao',
        tienDos: {
          create: {
            idNguoiDung: userId,
            trangThai: 'dang_lam',
            ghiChu: 'Đã hoàn thiện code và 100% unit tests.',
          },
        },
      },
    });
  }

  const summary = await prisma.nguoiDung.findUnique({
    where: { id: userId },
    select: {
      email: true,
      ten: true,
      hocKyHienTai: true,
      hocKyDaLuu: true,
      _count: {
        select: {
          monHocs: true,
          deadlines: true,
          giaoDichs: true,
          nganSachs: true,
          thoiKhoaBieus: true,
          taiLieuRags: true,
        },
      },
    },
  });

  console.log('Hoàn tất tạo dữ liệu mẫu! Thống kê tài khoản:');
  console.log(JSON.stringify(summary, null, 2));
}

seedDemoUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Lỗi khi tạo dữ liệu mẫu:', err);
    process.exit(1);
  });
