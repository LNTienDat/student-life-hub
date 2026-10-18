# 📌 BẢNG TỔNG HỢP CÁC ĐIỂM CÒN THIẾU & LỘ TRÌNH NÂNG CẤP DỰ ÁN
> **Dự án:** Student Life Hub  
> **Ngày lập:** 18/09/2026  
> **Cập nhật lần cuối:** 15/10/2026
> **Mục đích:** Bảng theo dõi cố định (không bị trôi tin nhắn) để kiểm soát chất lượng và hoàn thiện dự án lên chuẩn Production-Grade.

---

## Kết quả xác minh gần nhất — 15/10/2026

- Đã triển khai sáu cải tiến: Dashboard gọn, thao tác nhanh, đồng bộ số liệu, checklist, lọc học kỳ, nhập Excel/CSV có xem trước.
- Backend: 50/50 kiểm thử đạt trên 10 nhóm, gồm kiểm thử API và PostgreSQL thật. Tài khoản thử nghiệm được tự dọn; bài kiểm thử giao dịch riêng được hoàn tác.
- Frontend: 7/7 kiểm thử đạt; kiểm tra mã các phần thay đổi và bản dựng thành công.
- Đã áp dụng migration bổ sung checklist và học kỳ cho thời khóa biểu vào PostgreSQL local.
- Chưa xác nhận trực quan desktop/mobile vì trình duyệt kiểm tra không kết nối được máy chủ local. Chưa đánh giá tải lớn, vận hành production hoặc khả năng truy cập toàn bộ website.
- Không dùng nhận định “100/100” hay “Production-Ready” thay cho kết quả kiểm chứng.
- Hướng dẫn sử dụng và phạm vi thay đổi: [UPGRADE_NOTES.md](UPGRADE_NOTES.md).

---

## 📋 Ghi nhận từ đợt cải tiến trước

Danh sách dưới đây là lịch sử công việc, không phải chứng nhận mọi chức năng đã được kiểm định lại trong đợt này.

### 🔴 1. CÁC LỖI LOGIC NGHIỆP VỤ (ghi nhận từ đợt trước)
- [x] **Lỗi 1: Khóa danh mục Thu nhập (`finance.controller.js`)** — *Đã mở khóa DANH_MUC_THU (lương, học bổng, trợ cấp, thưởng) và đồng bộ giao diện.*
- [x] **Lỗi 2: Tính sai điểm GPA môn học dở dang (`grade.util.js`)** — *Chuẩn hóa tính điểm theo tổng trọng số các cột đã chấm, không kéo tụt GPA nữa.*
- [x] **Lỗi 3: Không đổi được môn học của Deadline (`deadline.controller.js`)** — *Bổ sung idMonHoc vào suaDeadline kèm kiểm tra quyền sở hữu.*
- [x] **Lỗi 4: Quên xóa cache tài chính (`TaiChinh.jsx`)** — *Tự động xóa finance_cache khi thêm/xóa giao dịch.*

---

### 🟡 2. TỐI ƯU KIẾN TRÚC & HIỆU NĂNG (ghi nhận từ đợt trước)
- [x] **Backend Service Layer (`academic.service.js`, `finance.service.js`, `chatbot.service.js`)** — *Tách toàn bộ logic nghiệp vụ, tính toán GPA, xu hướng và ngân sách ra khỏi Controllers.*
- [x] **Prisma Client Singleton** — *Dùng chung 1 connection pool duy nhất cho toàn bộ hệ thống, loại bỏ tình trạng rò rỉ kết nối PostgreSQL.*
- [x] **Hằng số tập trung `constants.js`** — *Định nghĩa tập trung cho Backend & Frontend.*
- [x] **Frontend API Service Layer (`front/src/services/`)** — *Tập trung toàn bộ axios calls vào academicService, financeService, deadlineService, timetableService, authService, notificationService.*
- [x] **Phân rã 5 "God Components" (> 300 - 675 dòng)** — *Dashboard, TaiChinh, Deadline, MonHoc, ThoiKhoaBieu đều được module hóa thành các subcomponents độc lập.*
- [x] **Tối ưu Vite Code-Splitting** — *Tách riêng `vendor-react` (178 kB), `vendor-utils` (60 kB), `vendor-motion`, `vendor-charts`, giúp chunk `index.js` giảm mạnh từ 295 kB xuống còn 66 kB (giảm 77% dung lượng tải trang chính!).*
- [x] **Smart Polling với Page Visibility API** — *Chỉ tải ngầm thông báo và deadline khi tab đang hiển thị, tự làm mới khi người dùng quay lại tab, tiết kiệm pin và CPU tối đa.*

---

### 🔴 3. KIỂM THỬ TỰ ĐỘNG (ghi nhận từ đợt trước)
- [x] **Cài đặt Jest & Supertest** trong backend.
- [x] **Unit Tests (`grade.util.test.js`)**:
  - Kiểm thử thuật toán tính điểm và quy đổi thang điểm 4.
  - Kiểm thử chuẩn hóa trọng số môn học dở dang.
- [x] **Unit Tests (`academic.service.test.js`)**:
  - Kiểm thử tính GPA tích lũy nhiều môn và trọng số.
  - Kiểm thử thuật toán phát hiện môn học nguy cơ.
  - Kiểm thử tính GPA phân nhóm theo từng học kỳ.
  - Kiểm thử thuật toán dự đoán điểm thi cần đạt.
- [x] **Unit Tests (`finance.service.test.js`)**:
  - Kiểm thử phòng vệ mã độc CSV/Formula Injection (`chongCongThuc`).
  - Kiểm thử thống kê tổng thu, tổng chi, số dư và hạn mức chi tiêu ngân sách.
- [x] **Unit Tests (`chatbot.service.test.js`)**:
  - Kiểm thử Context Injection dữ liệu sinh viên (GPA, môn nguy cơ, deadline 7 ngày, tài chính tháng, lịch học).
  - Kiểm thử các helper định dạng tiền tệ và quy đổi ngày trong tuần.
- [x] **Integration Tests (`api.test.js`)**:
  - Kiểm thử Health check DB kết nối.
  - Kiểm thử Authentication Guarding (từ chối request thiếu params, chặn token giả/thiếu token).
- [x] **Kết quả kiểm thử**: *33/33 tests PASS 100% trên 5 Test Suites*.

---

### 🟡 4. VẬN HÀNH & DEVOPS (ghi nhận từ đợt trước)
- [x] **Docker Multi-Stage**:
  - `back/Dockerfile` + `back/.dockerignore` (Node.js 20 Alpine với Prisma Client tự động sinh).
  - `front/Dockerfile` + `front/nginx.conf` + `front/.dockerignore` (Build Vite rồi serve bằng Nginx cực nhẹ, bật gzip và SPA routing).
- [x] **Docker Compose (`docker-compose.yml`)**:
  - Định nghĩa sẵn PostgreSQL 16 + Backend API + Frontend Nginx. Chạy toàn bộ hệ thống bằng đúng 1 lệnh `docker compose up`.
- [x] **Tối ưu tốc độ truyền tải**:
  - Tích hợp middleware `compression` (gzip) vào Express.
- [x] **CI/CD Pipeline GitHub Actions**:
  - File `.github/workflows/ci.yml` tự động kiểm tra code, chạy bộ test Jest và build Vite mỗi lần push/pull-request.
- [x] **Health Check Endpoint**:
  - Route `GET /api/health` giám sát DB ping và process uptime.

---

### 📖 5. TÀI LIỆU API, CHATBOT AI & UX POLISH (ghi nhận từ đợt trước)
- [x] **AI Personal Agent Chatbot**:
  - Context Injection tự động nạp dữ liệu thật của sinh viên vào Gemini prompt.
  - Giao diện có 4 gợi ý nhanh, render markdown, typing animation.
- [x] **Swagger UI (`/api-docs`)**:
  - Tích hợp `swagger-ui-express` và `swagger.json` chuẩn OpenAPI 3.0 với đầy đủ 30+ endpoints, trực quan, có thể test trực tiếp trên trình duyệt.
- [x] **Skeleton Loader (`Skeleton.jsx`)**:
  - Thay thế toàn bộ spinner tròn truyền thống bằng khung skeleton nhấp nháy hiện đại tại Dashboard, Tài chính, Deadline, Môn học, Thời khóa biểu.
- [x] **Hiệu ứng Gamification Confetti (`canvas-confetti`)**:
  - Tự động bắn pháo hoa giấy chúc mừng sinh viên khi hoàn thành Deadline.

---

## Việc cần xác nhận tiếp theo

- Xem thử các trang trên điện thoại thật và trình duyệt desktop ở cả hai chế độ sáng/tối.
- Kiểm tra cấu hình email/cron và chatbot với dịch vụ thực tế.
- Đánh giá triển khai và hiệu năng bằng môi trường, dữ liệu và yêu cầu sử dụng cụ thể.
