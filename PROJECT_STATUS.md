# 📌 STUDENT LIFE HUB - TRẠNG THÁI DỰ ÁN

> **Chuẩn bị tách giao diện 21/10:** [Static Site và chờ máy chủ](docs/guides/STATIC_FRONTEND_SETUP.md) — đã bổ sung xử lý khởi động chậm, thử lại GET và origin cho frontend riêng; chưa kích hoạt dịch vụ Static Site trên Render.

> **Kiểm thử mới nhất 21/10:** [Bảng nghiệm thu chức năng](docs/reports/FUNCTION_ACCEPTANCE.md) — 118 bài tự động và 119 kịch bản mở rộng đạt trên môi trường thử riêng. Có giới hạn về UI, email/AI thật, thiết bị di động và bản online; chưa xác nhận hoàn thiện 100%.

> **Cập nhật lần cuối**: 2026-10-21

> **Sửa lỗi mới nhất:** [BUGFIX_REPORT.md](docs/reports/BUGFIX_REPORT.md) — 115 bài kiểm thử và 119 kịch bản mở rộng đạt trên database thử riêng; migration nhóm/chia sẻ đã bổ sung. Các nhận xét ngày 20/10 bên dưới là lịch sử trước đợt sửa. Chưa triển khai bản sửa này lên online.

> **Phần mới trong mã local:** nhóm học tập và chia sẻ thời khóa biểu; chưa nghiệm thu hoặc triển khai. Xem [PROJECT_REVIEW_UPDATE.md](docs/reports/PROJECT_REVIEW_UPDATE.md) về migration còn thiếu, kiểm thử và lỗi phân quyền đã tái hiện.

> **Nghiệm thu hiện tại:** theo [MODULE_COMPLETION.md](docs/planning/MODULE_COMPLETION.md), thực hiện tuần tự từng phần, bắt đầu với tài khoản và dữ liệu cá nhân. Checklist tính năng cũ bên dưới chỉ ghi nhận mã đã triển khai, không xác nhận đã nghiệm thu trên bản online. Kết quả rà soát UX: [UX_REVIEW.md](docs/reports/UX_REVIEW.md).

> Đợt cập nhật mới: xem [UPGRADE_NOTES.md](docs/reports/UPGRADE_NOTES.md). Đã xác minh 50 kiểm thử backend và 7 kiểm thử frontend; chưa xác nhận trực quan bằng trình duyệt. Checklist cũ dưới đây ghi nhận phạm vi đã triển khai, không chứng minh hệ thống hoàn thiện hoặc sẵn sàng production.
> **Mục tiêu**: Hệ thống Quản lý Học tập, Deadline & Tài chính cho Sinh viên.
> **Tech Stack**: Node.js (Express) + PostgreSQL (Prisma) | React 19 (Vite) + TailwindCSS.
> **Source Code**: `github.com/LNTienDat/student-life-hub`

---

## 📈 1. Tổng Kết Tiến Độ

- **Tiến độ tổng thể**: Các chức năng nền đã triển khai; còn bước xác nhận trực quan và vận hành thực tế.
- **Danh mục cũ**: 37 chức năng đã có triển khai; còn khoảng trống ở giao diện, cấu hình dịch vụ và nghiệm thu luồng đầy đủ.
- **Database**: 7 Model (NguoiDung, MonHoc, Diem, Deadline, GiaoDich, NganSach, ThoiKhoaBieu)
- **Backend API**: 41 Endpoints nghiệp vụ
- **Frontend**: 10 Trang giao diện chuẩn Responsive + Dark mode

---

## 🎯 2. Checklist 37 chức năng đã triển khai (lịch sử, chưa phải nghiệm thu)

### 🟢 Module 0: Tài khoản & Xác thực
- [x] CN1: Đăng ký tài khoản
- [x] CN2: Đăng nhập / Đăng xuất (JWT)
- [x] CN3: Khôi phục mật khẩu qua email
- [x] CN4: Xem / chỉnh sửa hồ sơ
- [x] CN5: Thay đổi mật khẩu

### 🔵 Module 1: Quản lý Học tập
- [x] CN6: CRUD môn học
- [x] CN7: Nhập điểm thành phần
- [x] CN8: Tính điểm tổng kết môn
- [x] CN9: Tính GPA tích lũy
- [x] CN10: Dự đoán điểm cần đạt
- [x] CN11: Cảnh báo môn nguy cơ trượt
- [x] CN12: Biểu đồ GPA theo kỳ
- [x] CN13: Xuất bảng điểm PDF

### 🟠 Module 2: Quản lý Deadline & Lịch học
- [x] CN14: CRUD deadline
- [x] CN15: List View deadline
- [x] CN16: Calendar View deadline
- [x] CN17: Đánh dấu trạng thái hoàn thành
- [x] CN18: Bộ lọc & sắp xếp deadline
- [x] CN19: Thông báo nhắc deadline (Banner)
- [x] CN20: Thời khóa biểu tuần

### 🟡 Module 3: Quản lý Tài chính
- [x] CN21: CRUD giao dịch thu/chi
- [x] CN22: Phân loại danh mục
- [x] CN23: Đặt hạn mức ngân sách tháng
- [x] CN24: Cảnh báo vượt chi tiêu
- [x] CN25: Biểu đồ tròn cơ cấu chi tiêu
- [x] CN26: Biểu đồ xu hướng theo tháng
- [x] CN27: Lịch sử giao dịch & tìm kiếm

### 🟣 Module 4: Dashboard Tổng hợp
- [x] CN28: Trang chủ thống kê
- [x] CN29: Danh sách cảnh báo khẩn cấp
- [x] CN30: Mini-charts trên Dashboard

### 🔴 Module 5: Hệ thống Thông báo
- [x] CN31: In-app notification (biểu tượng chuông)
- [x] CN32: Email nhắc deadline (Cron Job tự động)
- [x] CN33: Email cảnh báo vượt ngân sách (Cron Job tự động)

### 🟤 Module 6: Tính năng Nâng cao
- [x] CN34: Chatbot hỏi đáp nhanh (Gemini AI)
- [x] CN35: Dark / Light Mode
- [x] CN36: Responsive Design
- [x] CN37: Xuất báo cáo tổng kết tài chính Excel

---

## Xác minh và công việc tiếp theo

Theo dõi kết quả thực tế trong PROJECT_GAPS.md; không quy đổi checklist tính năng thành mức hoàn thiện 100%.
