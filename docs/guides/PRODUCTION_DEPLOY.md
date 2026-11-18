# Hướng dẫn Đưa Student Life Hub (LifeHub) lên Production

Tài liệu này hướng dẫn cấu hình chuẩn để vận hành LifeHub như một sản phẩm thực tế cho nhiều người dùng, tách riêng Frontend (CDN nhanh, miễn phí) và Backend + PostgreSQL (luôn bật để chạy Cron nhắc deadline, Email và AI Vision/Chatbot).

---

## 1. Kiến trúc Khuyến nghị

| Thành phần | Dịch vụ đề xuất | Ghi chú |
| :--- | :--- | :--- |
| **Frontend (React + PWA)** | **Vercel** hoặc **Cloudflare Pages** | Root Directory: `front` · Build: `npm run build` · Output: `dist`. Đã có sẵn [`front/vercel.json`](../../front/vercel.json). |
| **Backend API (Node 24 + Express)** | **Render Starter** / **Railway** / **VPS** | Root Directory: `back` · Build: `npm ci && npx prisma generate && npx prisma migrate deploy` · Start: `node app.js`. |
| **PostgreSQL Database** | **Neon** hoặc **Supabase** | Dùng connection pool URL cho `DATABASE_URL`, bật Auto-Backup hằng ngày. |

---

## 2. Biến môi trường cần thiết

### A. Frontend (`front`)
```env
VITE_API_URL=https://api.ten-mien-cua-ban.com/api
```

### B. Backend (`back`)
```env
NODE_ENV=production
PORT=5000
TRUST_PROXY=true
SERVE_FRONTEND=false

# Frontend URL chính & các domain phụ (cách nhau bằng dấu phẩy, không có dấu *)
FRONTEND_URL=https://lifehub.ten-mien-cua-ban.com
ADDITIONAL_FRONTEND_URLS=https://student-life-hub.vercel.app

# Database PostgreSQL & JWT (tối thiểu 32 ký tự ngẫu nhiên)
DATABASE_URL=postgresql://user:pass@ep-xxxx.neon.tech/neondb?sslmode=require
JWT_SECRET=thay-bang-chuoi-ngau-nhien-dai-it-nhat-64-ky-tu

# Google Gemini AI (Chatbot + Hybrid RAG + AI Vision OCR Fallback)
CHATBOT_AI_ENABLED=true
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-3.5-flash-lite

# Email (khuyến nghị Resend HTTPS cho cloud hosting)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM=LifeHub <no-reply@ten-mien-cua-ban.com>
FEEDBACK_EMAIL=admin@ten-mien-cua-ban.com

# Bật Cron nhắc Deadline qua Email (cần gói Backend luôn chạy, không ngủ đông)
ENABLE_CRON_JOBS=true
```

---

## 3. Kiểm tra trước khi Mở cho Người dùng
1. Chạy `GET https://api.ten-mien-cua-ban.com/api/health` → trả về `200 { status: "ok" }`.
2. Chạy `GET https://api.ten-mien-cua-ban.com/api/imports/ocr-ai/status` (có Bearer token) → kiểm tra `aiSanSang: true`.
3. Mở trên điện thoại Android/iOS → kiểm tra nút **Cài đặt LifeHub (PWA)**, quét thử hóa đơn với Tesseract + nút **Quét lại bằng AI Vision**, và xuất thử **`.ics`** mở bằng Google Calendar.
4. Kiểm tra trang công khai **`/chinh-sach`** và tính năng **Góp ý & Báo lỗi** trong **Hồ sơ**.
