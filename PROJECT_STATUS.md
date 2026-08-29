# 📌 STUDENT LIFE HUB - TRẠNG THÁI DỰ ÁN

> **Cập nhật lần cuối**: 2026-08-29 (đối chiếu trực tiếp với source code trên GitHub)  
> **Mục tiêu**: Hệ thống Quản lý Học tập, Deadline & Tài chính cho Sinh viên (7 Module - 37 Chức năng).  
> **Tài liệu gốc**: `roadmap.docx` (nằm cùng thư mục).  
> **Tech Stack**: Backend Node.js (Express) + PostgreSQL + Prisma ORM | Frontend React (Vite).  
> **Source Code**: Đã được đưa lên GitHub (Public) — `github.com/LNTienDat/student-life-hub`

---

## 🏗️ 1. Tiến độ theo Lộ trình 8 Giai đoạn
| 1 | Phân tích yêu cầu & Xác định phạm vi | ✅ Xong | `roadmap.docx` đặc tả 37 chức năng |
| 2 | Thiết kế hệ thống & CSDL | ✅ Xong | Schema Prisma 6 model đầy đủ, 2 migration đã chạy |
| 3 | Thiết lập môi trường & Boilerplate | ✅ Xong | Backend Express + Prisma + PostgreSQL hoạt động, Frontend Vite + React đã khởi tạo |
| 4 | Hệ thống Xác thực (Auth) | ✅ Xong | Đăng ký, Đăng nhập JWT, Xem/Sửa hồ sơ, Đổi mật khẩu |
| 5 | Module Học tập & Deadline | ✅ Xong | API + Frontend đầy đủ CRUD, Biểu đồ GPA, Lịch Deadline, Thời khóa biểu |
| 6 | Module Tài chính & Dashboard | ✅ Xong | API + Frontend + Biểu đồ tròn & xu hướng thu chi, cảnh báo ngân sách trên Dashboard |
| 7 | Kiểm thử & Hoàn thiện UI | ✅ Xong | Đã thêm Dark/Light mode, Responsive Navbar, 8 trang tính năng |
| 8 | Triển khai & Báo cáo | 🟡 Đang làm | Đã đưa code lên GitHub thành công |

---

## 🔍 2. Chi tiết những gì ĐÃ CÓ

### Backend (`back/`)

```
back/
├── .env                          ✅ DATABASE_URL + JWT_SECRET
├── app.js                        ✅ Express server, mount 5 nhóm routes (Auth, Academic, Deadline, Finance, ThoiKhoaBieu)
├── package.json                  ✅ Các thư viện cần thiết
├── prisma/
│   └── schema.prisma             ✅ 6 models đầy đủ + model ThoiKhoaBieu
└── src/
    ├── prismaClient.js           ✅ Singleton Prisma Client
    ├── middlewares/
    │   └── auth.middleware.js     ✅ Xác thực JWT Bearer token
    └── modules/
        ├── auth/                  ✅ Controller & Routes (5 hàm)
        ├── academic/              ✅ Controller & Routes Học tập (9 hàm)
        ├── deadline/              ✅ Controller & Routes Deadline (6 hàm)
        ├── finance/               ✅ Controller & Routes Tài chính (8 hàm)
        └── thoikhoabieu/          ✅ Controller & Routes Thời khóa biểu (Thêm mới)
```

| Module | Tổng số API | Các chức năng chính | Trạng thái |
|--------|-------------|----------------------|:----------:|
| **Auth** | 5 | Đăng ký, Đăng nhập, Xem hồ sơ, Sửa hồ sơ, Đổi mật khẩu | ✅ Hoạt động |
| **Academic** | 9 | CRUD môn học, Thêm điểm, Tính GPA, GPA theo kỳ, Dự đoán, Cảnh báo | ✅ Hoạt động |
| **Deadline** | 6 | CRUD deadline, Hoàn thành deadline, Lấy deadline sắp tới | ✅ Hoạt động |
| **Finance** | 8 | CRUD giao dịch, Thống kê tháng, Xu hướng, Đặt ngân sách, Kiểm tra ngân sách | ✅ Hoạt động |
| **ThoiKhoaBieu**| ? | Quản lý thời khóa biểu tuần | ✅ Hoạt động |

### Database Schema (Prisma)

| Model | Mục đích | Có API? |
|-------|----------|:-------:|
| `NguoiDung` | User (email, matKhau, ten, avatar, truong, nganh, khoaHoc) | ✅ |
| `MonHoc` | Môn học (ten, tinChi, hocKy, trangThai) → FK NguoiDung | ✅ |
| `Diem` | Điểm đánh giá (loaiDanhGia, diem, trongSo) → FK MonHoc | ✅ |
| `Deadline` | Công việc/deadline (tieuDe, moTa, hanChot, doUuTien, trangThai) | ✅ |
| `GiaoDich` | Giao dịch thu/chi (loai, danhMuc, soTien, moTa) | ✅ |
| `NganSach` | Hạn mức ngân sách (danhMuc, soTienToiDa, thang, nam) | ✅ |
| `ThoiKhoaBieu`| Lưu trữ lịch học từng môn (thứ, tiết, phòng học) | ✅ |

### Frontend (`front/`)

```
front/src/
├── App.jsx                       ✅ Router chính (8 route có RequireAuth)
├── index.css                     ✅ Tailwind directives + Dark mode config
├── context/
│   ├── AuthContext.jsx           ✅ Quản lý trạng thái đăng nhập
│   └── ThemeContext.jsx          ✅ Quản lý Dark/Light mode
├── services/
│   └── api.js                    ✅ Axios kết nối backend
├── components/
│   └── Layout.jsx                ✅ Navbar điều hướng + Dark mode toggle + Banner nhắc deadline
└── pages/
    ├── Login.jsx                 ✅ Trang đăng nhập
    ├── Register.jsx              ✅ Trang đăng ký
    ├── Dashboard.jsx             ✅ Trang tổng quan (đã ghép đầy đủ cảnh báo, có mini-charts)
    ├── MonHoc.jsx                ✅ Quản lý môn học (CRUD + Sửa + Biểu đồ GPA)
    ├── Deadline.jsx              ✅ Quản lý deadline (CRUD + Sửa + Lịch Calendar)
    ├── TaiChinh.jsx              ✅ Quản lý tài chính + Lịch sử/Tìm kiếm/Phân trang + Biểu đồ
    ├── ThoiKhoaBieu.jsx          ✅ Giao diện xem lịch học theo tuần
    └── Profile.jsx               ✅ Xem/sửa hồ sơ + Đổi mật khẩu
```

| Mục | Trạng thái |
|-----|:----------:|
| React 19 + Vite 8 | ✅ Cấu trúc ổn định |
| TailwindCSS & PostCSS | ✅ Đã cấu hình thủ công + `darkMode` class |
| React Router DOM | ✅ Đã cấu hình (`App.jsx`) |
| API Services (Axios) | ✅ Đã cấu hình (`api.js`) |
| State Management | ✅ Dùng Context API (`AuthContext`, `ThemeContext`) |
| Recharts (Vẽ biểu đồ) | ✅ Đã cấu hình biểu đồ Tròn, Đường, Cột |
| Component dùng chung | ✅ `Layout.jsx` (Responsive, Theme Switcher, Alert Banner) |
| Các trang tính năng | ✅ **8 trang**: Login, Register, Dashboard, MonHoc, Deadline, TaiChinh, Profile, ThoiKhoaBieu |
| GitHub | ✅ Đã đẩy code lên Public Repo |

---

## 📊 3. Checklist 7 Module (37 Chức năng)

### Module 0: Tài khoản & Xác thực (CN 1–5)
- [x] CN1: Đăng ký tài khoản (Email, Mật khẩu, Họ tên)
- [x] CN2: Đăng nhập / Đăng xuất (JWT)
- [ ] CN3: Khôi phục mật khẩu qua email
- [x] CN4: Xem / chỉnh sửa hồ sơ cá nhân
- [x] CN5: Thay đổi mật khẩu

### Module 1: Quản lý Học tập (CN 6–13)
- [x] CN6: CRUD môn học (có nút Sửa trên UI)
- [x] CN7: Nhập điểm thành phần (trọng số tùy chỉnh)
- [x] CN8: Tính điểm tổng kết môn
- [x] CN9: Tính GPA tích lũy (thang 4 & 10)
- [x] CN10: Dự đoán điểm cần đạt
- [x] CN11: Cảnh báo môn nguy cơ trượt
- [x] CN12: Biểu đồ GPA theo kỳ
- [ ] CN13: Xuất bảng điểm PDF/Excel

### Module 2: Quản lý Deadline & Lịch học (CN 14–20)
- [x] CN14: CRUD deadline (có nút Sửa trên UI)
- [x] CN15: List View deadline
- [x] CN16: Calendar View deadline
- [x] CN17: Đánh dấu trạng thái hoàn thành
- [x] CN18: Bộ lọc & sắp xếp deadline (Lọc deadline sắp tới, trạng thái)
- [x] CN19: Thông báo nhắc deadline (Có push notification trình duyệt + Banner cảnh báo)
- [x] CN20: Thời khóa biểu tuần

### Module 3: Quản lý Tài chính (CN 21–27)
- [x] CN21: CRUD giao dịch thu/chi
- [x] CN22: Phân loại danh mục
- [x] CN23: Đặt hạn mức ngân sách tháng
- [x] CN30: Mini-charts trên Dashboard (PieChart chi tiêu + BarChart GPA theo kỳ)

### Module 5: Hệ thống Thông báo (CN 31–33) — ❌ 0/3
- [ ] CN31: In-app notification (biểu tượng chuông trên navbar)
- [ ] CN32: Email nhắc deadline (Cron Job tự động gửi)
- [ ] CN33: Email cảnh báo vượt ngân sách

### Module 6: Tính năng Nâng cao (CN 34–37) — 🟡 3/4
- [ ] CN34: Chatbot hỏi đáp nhanh
- [x] CN35: Dark / Light Mode (ThemeContext + toggle ☀️/🌙 + CSS overrides + auto theo hệ thống)
- [x] CN36: Responsive Design (Navbar desktop + mobile dropdown)
- [x] CN37: Xuất báo cáo tổng kết Excel (ExcelJS, 3 sheets: Chi tiết, Tổng hợp, Tổng kết)

---

## 📈 4. Tổng kết

| Chỉ số | Giá trị |
|--------|---------|
| **Tiến độ tổng thể** | **~89%** (33/37 chức năng) |
| **Chức năng hoàn thành** | **33 / 37** |
| **Giai đoạn hoàn thành** | **6 / 8** (GĐ 1-6 ✅, GĐ 7-8 đang làm) |
| **Backend modules** | **5 modules** (Auth, Academic, Deadline, Finance, ThoiKhoaBieu) |
| **Backend API endpoints** | **36 endpoints** (Auth 7, Academic 10, Deadline 6, Finance 9, ThoiKhoaBieu 4) |
| **Backend controller functions** | **36 hàm** xử lý nghiệp vụ |
| **Database models** | **7 / 7 model** đều đã có API xử lý |
| **Frontend routes** | **11 routes** (4 public + 6 protected + 1 redirect) |
| **Frontend pages** | **10 trang** hoàn chỉnh |
| **Frontend contexts** | **2 contexts** (AuthContext + ThemeContext) |
| **Thư viện Backend** | express, prisma, jwt, bcrypt, nodemailer, pdfkit, exceljs, cors, dotenv |
| **Thư viện Frontend** | react 19, vite 8, react-router-dom 7, axios, recharts, tailwindcss 3 |

---

## 🎯 5. Công việc tiếp theo cần làm (4 chức năng còn lại)

### Ưu tiên trung bình
1. **Hệ thống thông báo (CN31–33)** — In-app notification (biểu tượng chuông) + Email Cron Job nhắc deadline + Email cảnh báo vượt ngân sách.

### Ưu tiên thấp
2. **CN34 — Chatbot hỏi đáp nhanh** — Tích hợp chatbot AI hoặc FAQ bot hỗ trợ sinh viên.
