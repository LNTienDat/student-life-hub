# 📌 Student Life Hub

Hệ thống quản lý học tập, deadline và tài chính cho sinh viên đại học Việt Nam.

Đồ án tốt nghiệp — 37/37 chức năng hoàn thành. Xem chi tiết tiến độ tại [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) và đặc tả gốc tại [`roadmap.docx`](./roadmap.docx).

## Tính năng chính

- **Học tập**: CRUD môn học, nhập điểm, tính GPA (tích lũy + theo kỳ), dự đoán điểm cần đạt, cảnh báo môn nguy cơ, xuất bảng điểm PDF
- **Deadline & Thời khóa biểu**: quản lý deadline (danh sách/lịch), thời khóa biểu tuần, nhắc hạn qua banner + email
- **Tài chính**: theo dõi thu/chi, đặt ngân sách theo danh mục, cảnh báo vượt ngân sách, biểu đồ, xuất báo cáo Excel
- **Tài khoản**: đăng ký/đăng nhập JWT, quên/đặt lại mật khẩu qua email, đổi email (xác thực mật khẩu), đổi mật khẩu
- **Thông báo**: chuông thông báo in-app, email nhắc deadline & cảnh báo ngân sách tự động (cron job)
- **Trợ lý ảo**: chatbot hỏi đáp nhanh tích hợp Gemini Flash API
- **Giao diện**: responsive, Dark/Light mode, thiết kế riêng theo ẩn dụ "sổ tay sinh viên"

## Tech Stack

| | |
|---|---|
| **Backend** | Node.js, Express 5, PostgreSQL, Prisma ORM, JWT, Nodemailer, node-cron, ExcelJS, PDFKit |
| **Frontend** | React 19, Vite, TailwindCSS 3, React Router 7, Recharts, Framer Motion, Axios |

## Cài đặt & chạy thử

### 1. Backend

```bash
cd back
npm install
cp .env.example .env   # điền DATABASE_URL, JWT_SECRET (bắt buộc) — xem chi tiết trong file
npx prisma db push     # tạo schema trên database
npm run dev            # chạy tại http://localhost:5000
```

### 2. Frontend

```bash
cd front
npm install
npm run dev             # chạy tại http://localhost:5173
```

> Email (quên mật khẩu, nhắc deadline) và Chatbot (Gemini) là tính năng tùy chọn — nếu không cấu hình biến môi trường tương ứng trong `.env`, hệ thống vẫn chạy bình thường, chỉ tắt/log thay vì gửi thật. Xem `back/.env.example` để biết đầy đủ các biến.

## Cấu trúc thư mục

```
back/
├── prisma/schema.prisma      # 7 model: NguoiDung, MonHoc, Diem, Deadline, GiaoDich, NganSach, ThoiKhoaBieu
└── src/
    ├── modules/               # auth, academic, deadline, finance, thoikhoabieu, thongbao, chatbot
    ├── cron/                  # job nhắc deadline (07:00) & cảnh báo ngân sách (08:00) mỗi ngày
    └── utils/                 # gửi email dùng chung

front/
└── src/
    ├── pages/                 # 10 trang: Dashboard, MonHoc, Deadline, ThoiKhoaBieu, TaiChinh, Profile, Login, Register, QuenMatKhau, DatLaiMatKhau
    ├── components/            # Layout (navbar), Chatbot, GlowingNav, Autocomplete...
    └── context/                # AuthContext, ThemeContext
```
