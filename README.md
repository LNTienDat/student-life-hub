# Student Life Hub (LifeHub)

Hệ thống ứng dụng web (hỗ trợ cài đặt Progressive Web App — PWA) quản lý tập trung **học tập & điểm số**, **thời khóa biểu**, **deadline công việc**, **tài chính cá nhân & ngân sách**, cùng **kho tài liệu & trợ lý AI** dành cho sinh viên đại học Việt Nam.

Dự án được xây dựng phục vụ học phần **Đồ án Cơ sở 2**.

---

## Mục lục

1. [Mục đích dự án](#1-mục-đích-dự-án)
2. [Tính năng chính](#2-tính-năng-chính)
3. [Các công nghệ thông minh tích hợp](#3-các-công-nghệ-thông-minh-tích-hợp)
4. [Công nghệ sử dụng (Tech Stack)](#4-công-nghệ-sử-dụng-tech-stack)
5. [Cấu trúc thư mục](#5-cấu-trúc-thư-mục)
6. [Cài đặt & Chạy dự án](#6-cài-đặt--chạy-dự-án)
7. [Kiểm thử tự động](#7-kiểm-thử-tự-động)
8. [Tài liệu tham khảo nội bộ](#8-tài-liệu-tham-khảo-nội-bộ)

---

## 1. Mục đích dự án

**Student Life Hub** giải quyết bài toán phân mảnh công cụ quản lý đời sống học đường của sinh viên (bảng điểm ở cổng đào tạo, lịch học trên ảnh chụp, deadline ghi rời rạc, chi tiêu hằng ngày khó theo dõi và tài liệu ôn tập phân tán). Ứng dụng gom các nghiệp vụ này vào một nền tảng thống nhất theo từng tài khoản và từng học kỳ, đồng thời kết hợp xử lý cục bộ trên thiết bị (offline-capable) với các mô-đun AI có kiểm chứng dữ liệu.

---

## 2. Tính năng chính

### Tổng quan hôm nay (`/dashboard`)
- Hiển thị lịch học trong ngày, danh sách deadline quá hạn và sắp đến hạn (tính theo múi giờ `Asia/Ho_Chi_Minh`), tóm tắt thu/chi và hạn mức ngân sách tháng hiện tại.
- Khung **Thêm nhanh** (`QuickEntry`) cho phép tạo nhanh khoản chi hoặc công việc ngay tại trang chủ kèm gợi ý phân loại tự động.

### Học tập & Điểm số (`/mon-hoc`)
- Quản lý danh sách học kỳ (`SemesterContext`), thêm/sửa/xóa môn học và các cột điểm thành phần (ràng buộc tổng trọng số không vượt quá `100%`).
- Tính **GPA học kỳ** và **GPA tích lũy** song song trên **thang điểm 10** và **thang điểm 4**, hỗ trợ quy đổi qua lại giữa điểm hệ 10, hệ 4 và điểm chữ (`A+`, `A`, `B+`, `B`, `C+`, `C`, `D+`, `D`, `F`).
- Cảnh báo các môn học có nguy cơ điểm thấp, tính điểm thành phần cần đạt (`GradePredictorModal`) và **giả lập GPA tương lai** (`WhatIfGpaModal`) cho các môn đang học dở hoặc môn dự kiến kỳ tới.
- Nhập danh sách môn học từ tệp `CSV`/`XLSX` (`ImportPanel`), đồng bộ môn từ Thời khóa biểu, **quét bảng điểm từ ảnh** (`TranscriptImportModal`) và xuất bảng điểm ra tệp **PDF** (`PDFKit`).

### Thời khóa biểu (`/lich-hoc`)
- Quản lý lịch học lặp hằng tuần từ Thứ 2 đến Chủ nhật, kiểm tra chống trùng khung giờ.
- Điều chỉnh lịch theo từng ngày cụ thể (`DieuChinhLich`: báo nghỉ, học bù hoặc đổi phòng/giờ cho riêng một ngày mà không làm hỏng lịch lặp gốc).
- Nhập thời khóa biểu từ tệp `CSV` hoặc **nhận diện từ ảnh chụp lịch học** (`TimetableImageImport`), xuất tệp lịch `.ics` chuẩn hoặc thêm nhanh vào Google Calendar (`icsExport.js`).
- Phát hành liên kết chia sẻ thời khóa biểu công khai theo phạm vi học kỳ cố định (`/chia-se-tkb/:token`).
- Tích hợp công cụ **Xếp lịch ôn tập thông minh** (`StudyPlannerModal`) và chuyển các phiên ôn đã chọn thành công việc trong mục Deadline.

### Quản lý Deadline (`/deadline`)
- Tạo, sửa, xóa, đánh dấu hoàn thành/mở lại công việc gắn với từng môn học; hỗ trợ danh sách bước con (`ChecklistEditor`).
- Lọc và sắp xếp theo trạng thái, mức độ ưu tiên (`Thấp`, `Bình thường`, `Khẩn cấp` — ưu tiên mức độ quan trọng trước, sau đó đến hạn chót gần nhất).
- Hỗ trợ trích xuất thông tin hạn chót từ ảnh chụp thông báo bài tập (`ocrDeadline.js`) và tùy chọn tự động dọn deadline đã hoàn thành.

### Tài chính cá nhân & Ngân sách (`/tai-chinh`)
- Ghi nhận giao dịch thu/chi theo ngày, tìm kiếm, phân trang và lọc theo loại giao dịch hoặc danh mục.
- Quản lý danh mục thu/chi mặc định và danh mục riêng của người dùng (`DanhMucTaiChinh`, hỗ trợ ẩn danh mục cũ mà vẫn bảo toàn dữ liệu lịch sử).
- Đặt hạn mức ngân sách theo danh mục cho từng tháng/năm, cảnh báo tỷ lệ sử dụng ngân sách và hiển thị biểu đồ cơ cấu/xu hướng nhiều tháng (`Recharts`).
- **Quét hóa đơn từ ảnh** (`ReceiptImport`) kèm kiểm tra trùng lặp hóa đơn bằng mã băm ảnh (`anhHoaDonHash`), **dự báo chi tiêu cuối tháng & phát hiện giao dịch bất thường** (`FinanceForecastCard`), và xuất sổ thu chi ra tệp **Excel (`.xlsx`)** có lọc chống CSV/Formula Injection.

### Kho tài liệu & Ôn tập (`/tai-lieu`)
- Lưu trữ tài liệu cá nhân từ tệp `PDF` (tối đa 100 trang, 4 MB, tách trang trong tiến trình riêng `pdf.worker.js`), `TXT`, `MD` hoặc dán văn bản trực tiếp (giới hạn tối đa 20 tài liệu / 600.000 ký tự mỗi tài khoản), đi kèm tài liệu hướng dẫn mặc định của hệ thống.
- Tự động sinh bộ **Flashcard & câu hỏi Trắc nghiệm 4 đáp án** (tùy chọn `3–20` câu, có lọc theo chủ đề trọng tâm và dẫn nguồn trang tài liệu) và ôn tập thẻ ghi nhớ theo lịch lặp lại ngắt quãng (`RagStudyModal`).

### Trợ lý ảo LifeHub (`Chatbot.jsx`)
- Hộp thoại chat nổi hỗ trợ kéo thả lưu vị trí trên màn hình, tiếp tục nhận phản hồi ở chế độ nền khi đóng hộp thoại, và nhập câu lệnh bằng giọng nói (Web Speech API — giữ văn bản trong ô nhập để người dùng chỉnh sửa trước khi gửi).
- Kết hợp 4 luồng xử lý trong một cuộc trò chuyện:
  1. Tra cứu trực tiếp dữ liệu học tập, lịch học, deadline, thu/chi (hỗ trợ cả tháng hiện tại, từng tháng/năm trước và toàn bộ thời gian).
  2. Hỏi đáp dựa trên kho tài liệu cá nhân kèm trích dẫn đoạn nguồn `[S1]`, `[S2]`.
  3. Tư vấn kế hoạch học tập qua Google Gemini API (chỉ gửi dữ liệu khi người dùng chủ động bật đồng ý trong *Tùy chọn trợ lý*).
  4. Đề xuất thẻ thao tác tạo nhanh giao dịch, deadline, buổi học hoặc ngân sách để người dùng kiểm tra và bấm xác nhận thực thi (`AgentActionCard`).

### Tài khoản, Thông báo, Giao diện & Tiện ích khác
- **Xác thực & Hồ sơ (`/login`, `/register`, `/quen-mat-khau`, `/dat-lai-mat-khau`, `/ho-so`):** Đăng ký/đăng nhập bằng JWT (tự động vô hiệu hóa phiên cũ khi đổi mật khẩu thông qua mốc `matKhauDoiLuc`), khôi phục mật khẩu qua email, đổi email xác thực bằng mật khẩu, cập nhật thông tin trường/ngành/khóa và ảnh đại diện.
- **Thông báo & Cron job:** Chuông thông báo trong ứng dụng (`/api/thong-bao`); lập lịch tự động (`node-cron`, múi giờ `Asia/Ho_Chi_Minh`) gửi email nhắc deadline sắp đến hạn trong 24 giờ lúc `07:00` và cảnh báo vượt ngân sách lúc `08:00` hằng ngày (hỗ trợ cả `SMTP` và `Resend HTTPS API`).
- **Nhóm học tập (API & CSDL `/api/nhom`):** Backend và Prisma schema hỗ trợ tạo nhóm học tập, tham gia bằng mã mời, giao deadline nhóm và cập nhật tiến độ từng thành viên.
- **Trải nghiệm người dùng:** Giao diện Sáng/Tối (`ThemeContext`), chuyển đổi ngôn ngữ **Tiếng Việt / English** (`front/src/i18n/`), tiện ích chọn ngẫu nhiên sinh viên hoạt họa Canvas (`/chon-ngau-nhien`), trang chính sách dữ liệu (`/chinh-sach`), hỗ trợ cài đặt PWA và trang dự phòng khi mất mạng (`offline.html`).

---

## 3. Các công nghệ thông minh tích hợp

1. **Neuro-Symbolic AI — Xếp lịch ôn tập tối ưu (`back/src/modules/planner/`):**
   - Tầng *Neural* (`neural.parser.js`) phân tích yêu cầu tiếng Việt tự nhiên qua Gemini JSON Schema (tự chuyển về bộ phân tích quy tắc nội bộ khi không dùng AI) thành tập tham số ràng buộc.
   - Tầng *Symbolic* (`symbolic.solver.js`) giải bài toán phân bổ khung giờ xác định: chấm điểm ưu tiên môn học (theo hạn deadline và điểm thành phần hiện tại), kiểm chứng **0 trùng lịch học trên lớp** (kể cả lịch điều chỉnh trong tuần) và **0 tự chồng giờ**, kèm giải thích lý do chọn từng phiên.
2. **EdgeAI — Phân loại tự học trên trình duyệt & OCR cục bộ (`front/src/utils/edgeClassifier.js`, `front/src/services/`):**
   - Mô hình phân loại văn bản đa thức kết hợp đặc trưng từ đơn, cặp từ (`bigram`), cụm 3 ký tự (`trigram`), khoảng số tiền và khoảng thời gian hạn chót chạy trực tiếp trên trình duyệt với độ trễ vài phần mười mili-giây, hoạt động cả khi ngoại tuyến, tự học bổ sung (online learning) và **đồng bộ theo tài khoản qua PostgreSQL** (`/api/sync/edge-ai`, `aiSyncService.js`).
   - Nhận diện chữ từ ảnh hóa đơn và thời khóa biểu ngay trên trình duyệt bằng mạng nơ-ron **LSTM WebAssembly** (`tesseract.js` v7) kết hợp tiền xử lý ảnh cục bộ (`receiptPreprocess.js`, `timetableImage.js`).
3. **AI Agent Tool-Calling & Nhận diện giọng nói (`back/src/modules/chatbot/agent.service.js`, `front/src/components/AgentActionCard.jsx`, `front/src/utils/speechRecognition.js`):**
   - Phân tích câu lệnh tự nhiên thành lời gọi công cụ có cấu trúc (`create_transaction`, `create_deadline`, `create_class_session`, `set_budget`) thông qua Gemini Function Calling hoặc bộ tách lệnh cục bộ; luôn yêu cầu người dùng xác nhận trên thẻ giao diện trước khi ghi vào CSDL.
   - Tích hợp Web Speech API chuyển giọng nói thành bản nháp văn bản có thể chỉnh sửa trực tiếp hoặc nói nối tiếp nhiều câu.
4. **Hybrid RAG & Sinh học liệu tự động (`back/src/modules/rag/`):**
   - Chia đoạn tài liệu có chồng lấn (`chunkPages`), truy xuất kết hợp điểm từ khóa **BM25** và độ tương đồng cosine trên **Vector Embedding 64 chiều** (`rag.text.js`), kiểm chứng mã nguồn trích dẫn `[S1]` và số liệu trước khi trả kết quả (`rag.service.js`).
   - Sinh tự động bộ câu hỏi trắc nghiệm 4 lựa chọn và thẻ lật Flashcard từ trích đoạn tài liệu (`study.service.js`) qua Gemini Structured Output hoặc bộ trích xuất cục bộ dự phòng.
5. **Thuật toán lặp lại ngắt quãng SuperMemo-2 (`front/src/utils/sm2.js`, `front/src/services/studyDeckService.js`):**
   - Tính toán chu kỳ ôn tập thẻ ghi nhớ (`interval`, `repetitions`, hệ số `easeFactor` tối thiểu `1.3`) dựa trên 4 mức phản hồi (`Quên`, `Khó`, `Tốt`, `Dễ`) theo ngày lịch Việt Nam, kèm **đồng bộ đa thiết bị theo cơ chế offline-first** qua `/api/sync/sm2` (`BoTheOnTap`).
6. **Phân tích dự báo định lượng & Giả lập What-If (`back/src/modules/finance/analytics.service.js`, `front/src/utils/gpaSimulator.js`):**
   - Ước tính tốc độ chi tiêu mỗi ngày (Burn Rate kết hợp trung bình tháng và 7 ngày gần nhất), dự phóng tổng chi cuối tháng, hạn mức chi an toàn mỗi ngày còn lại, và phát hiện khoản chi đột biến bằng kiểm định **Z-score** kết hợp khoảng tứ phân vị **Tukey IQR**.
   - Mô phỏng kịch bản điểm số thời gian thực cho các học phần chưa đủ 100% trọng số và các học phần dự kiến học tiếp theo.
7. **AI Vision Multimodal OCR (`back/src/modules/imports/visionOcr.service.js`):**
   - Đọc và chuẩn hóa dữ liệu từ ảnh chụp hóa đơn, thời khóa biểu và bảng điểm đại học bằng Google Gemini Vision JSON Schema (hỗ trợ tự động quy đổi trọng số thập phân về phần trăm, loại bỏ cột điểm tổng kết trùng lặp khi đã đủ điểm thành phần, và thử lại khi dịch vụ gặp lỗi `503` tạm thời).

---

## 4. Công nghệ sử dụng (Tech Stack)

| Phân tầng | Công nghệ & Thư viện (xác minh từ `package.json` & cấu hình) |
|---|---|
| **Frontend** | React `19.2.8`, Vite `8.x`, React Router DOM `7.18.2`, TailwindCSS `3.4.1`, Framer Motion `13.1.1`, Recharts `3.10.1`, Lucide React `1.37.0`, Axios `1.20.0`, Canvas Confetti `1.9.4` |
| **Xử lý trên trình duyệt & PWA** | Tesseract.js `7.0.0` (`@tesseract.js-data/vie`, `@tesseract.js-data/eng`), Web Speech API, Service Worker PWA (`front/pwa/`), Code Splitting (`vendor-react`, `vendor-charts`, `vendor-motion`) |
| **Backend** | Node.js (CommonJS), Express `5.2.1`, Prisma ORM `5.8.0`, Zod `4.6.x` (kiểm tra schema đầu vào), JSON Web Token (`jsonwebtoken` `9.0.3`), `bcryptjs` `3.0.3`, `helmet` `8.3.0`, `express-rate-limit` `8.7.0`, `cors` `2.8.6`, `compression` `1.8.2` |
| **Cơ sở dữ liệu** | PostgreSQL (`postgres:16-alpine` trong Docker & CI; quản lý lược đồ qua `back/prisma/schema.prisma` và `migrations/`) |
| **Tệp tin, Tài liệu & Email** | `pdf-parse` `2.4.5` (worker tách biệt), `pdfkit` `0.15.0` (xuất PDF), `exceljs` `4.4.0` (xuất Excel), `nodemailer` `10.0.1` (SMTP) & Resend HTTPS API, `node-cron` `4.6.0`, `swagger-ui-express` `5.0.1` (`/api-docs`) |
| **Dịch vụ AI tích hợp** | Google Gemini REST API (mặc định `gemini-3.5-flash-lite`, cấu hình qua biến môi trường `GEMINI_MODEL` và `GEMINI_API_KEY`) |
| **Kiểm thử & CI/CD** | Jest `30.5.2` & Supertest `7.2.2` (Backend), Node Test Runner `node --test` (Frontend & PWA), Playwright `1.64.1` (E2E Chromium), ESLint `10.8.0`, Docker Compose, GitHub Actions (`.github/workflows/ci.yml`), Render Blueprints (`render.yaml`, `render-static.yaml`) |

---

## 5. Cấu trúc thư mục

```text
Do_An_2_SLH/
├── .github/workflows/ci.yml       # Pipeline CI tự động kiểm tra build, unit/integration test và Playwright E2E
├── back/                          # Máy chủ Backend (Express 5 + Prisma + PostgreSQL)
│   ├── app.js                     # Điểm khởi chạy Express, bảo mật Helmet/CORS/Rate-limit, Swagger & Graceful Shutdown
│   ├── Dockerfile                 # Đóng gói container Backend (Node 24 Alpine)
│   ├── .env.example               # Mẫu biến môi trường Backend
│   ├── prisma/
│   │   ├── schema.prisma          # Lược đồ CSDL (NguoiDung, MonHoc, Diem, Deadline, GiaoDich, NganSach, ThoiKhoaBieu, DieuChinhLich, TaiLieuRag, BoTheOnTap, MoHinhEdgeAi, DanhMucTaiChinh, NhomHocTap...)
│   │   └── migrations/            # Lịch sử migration PostgreSQL
│   ├── scripts/
│   │   ├── seed-demo-user.cjs     # Script nạp bộ dữ liệu mẫu đầy đủ cho một tài khoản email
│   │   └── functional-audit.cjs   # Script rà soát chức năng backend
│   ├── src/
│   │   ├── constants.js           # Hằng số nghiệp vụ, danh mục, giới hạn dữ liệu và rate-limit
│   │   ├── prismaClient.js        # Khởi tạo kết nối Prisma Client
│   │   ├── middlewares/           # Xác thực JWT (auth.middleware.js), Zod (validate.middleware.js) và rate-limit
│   │   ├── cron/                  # Tác vụ định kỳ gửi email nhắc deadline (07:00) & vượt ngân sách (08:00)
│   │   ├── docs/swagger.json      # Đặc tả OpenAPI phục vụ trang /api-docs
│   │   ├── utils/                 # Tiện ích xử lý ngày giờ VN, quy đổi điểm, tiền tệ, email, giao dịch tuần tự
│   │   └── modules/               # Các mô-đun nghiệp vụ tách theo miền:
│   │       ├── auth/              # Đăng ký, đăng nhập, hồ sơ, mật khẩu, đổi email
│   │       ├── semester/          # Quản lý học kỳ lưu trữ và học kỳ hiện hành
│   │       ├── academic/          # Môn học, điểm số, GPA, cảnh báo nguy cơ, xuất PDF
│   │       ├── thoikhoabieu/      # Lịch học tuần, kiểm tra trùng giờ, điều chỉnh theo ngày, chia sẻ TKB
│   │       ├── deadline/          # Quản lý công việc, checklist, hoàn thành và tự động dọn dẹp
│   │       ├── finance/           # Giao dịch, ngân sách, danh mục, phân tích dự báo/bất thường, xuất Excel
│   │       ├── rag/               # Đọc PDF/TXT/MD, Hybrid BM25 + Vector 64D, kiểm chứng nguồn, sinh Quiz/Flashcard
│   │       ├── planner/           # Neuro-Symbolic Study Planner (neural.parser.js + symbolic.solver.js)
│   │       ├── chatbot/           # Trợ lý ảo hợp nhất, kết nối Gemini API và AI Agent Tool-Calling
│   │       ├── imports/           # Nhập CSV/Excel và nhận diện ảnh AI Vision (hóa đơn, TKB, bảng điểm)
│   │       ├── sync/              # Đồng bộ bộ thẻ ôn tập & mô hình gợi ý cá nhân lên PostgreSQL
│   │       ├── thongbao/          # Tổng hợp thông báo trong ứng dụng & kích hoạt thử email
│   │       ├── nhom/              # Nhóm học tập và deadline nhóm
│   │       └── feedback/          # Gửi góp ý / phản hồi từ người dùng
│   └── tests/
│       ├── unit/                  # 26 bộ kiểm thử đơn vị (Jest)
│       └── integration/           # Kiểm thử tích hợp API & cơ sở dữ liệu
├── front/                         # Ứng dụng Frontend (React 19 + Vite 8 + TailwindCSS)
│   ├── Dockerfile & nginx.conf    # Đóng gói container Frontend phục vụ qua Nginx Alpine
│   ├── .env.example               # Mẫu biến môi trường Frontend (VITE_API_URL)
│   ├── vite.config.js             # Cấu hình proxy /api, plugin PWA, plugin OCR và tách gói bundle
│   ├── playwright.config.js       # Cấu hình kiểm thử trình duyệt E2E cô lập
│   ├── ocr/ & pwa/                # Plugin Vite đóng gói tài nguyên Tesseract WASM và Service Worker
│   ├── public/                    # Biểu tượng ứng dụng, manifest.webmanifest, offline.html
│   ├── src/
│   │   ├── App.jsx                # Định tuyến ứng dụng (Lazy loading các trang)
│   │   ├── pages/                 # Các màn hình: Dashboard, MonHoc, ThoiKhoaBieu, Deadline, TaiChinh, TaiLieu, Profile, ChiaSeTKB, RandomPicker, ChinhSach...
│   │   ├── components/            # Thành phần giao diện dùng chung & các hộp thoại thông minh (Chatbot, AgentActionCard, StudyPlannerModal, RagStudyModal, WhatIfGpaModal, EdgeAiStatusCard...)
│   │   ├── context/               # AuthContext, ThemeContext, SemesterContext, FinanceCategoryContext, ToastContext...
│   │   ├── services/              # Lớp gọi API (có xử lý cold-start & cache), OCR cục bộ, quản lý bộ thẻ SM-2, EdgeAI
│   │   ├── utils/                 # Bộ phân loại EdgeAI, thuật toán SM-2, giả lập GPA, thang điểm, giọng nói, xuất ICS
│   │   ├── hooks/ & i18n/         # Custom hooks và từ điển đa ngôn ngữ (Tiếng Việt / English)
│   │   └── pwa/                   # Đăng ký và quản lý cập nhật Service Worker
│   ├── tests/                     # Kiểm thử đơn vị logic Frontend, PWA và gói build
│   └── e2e/                       # Kịch bản kiểm thử trình duyệt Playwright
├── scripts/                       # Công cụ vận hành: start-local.ps1, database-tools.cjs, render-build/start.mjs
├── docs/                          # Tài liệu hướng dẫn cấu hình (guides/), thiết kế (planning/), báo cáo & QA
├── docker-compose.yml             # Khởi chạy trọn bộ PostgreSQL + Backend + Frontend bằng Docker
├── render.yaml & render-static.yaml # Cấu hình triển khai trên nền tảng Render
├── Mo_LifeHub.cmd                 # Tệp chạy nhanh toàn bộ hệ thống local trên Windows
└── Sao_Luu_CSDL.cmd               # Tệp sao lưu cơ sở dữ liệu PostgreSQL local trên Windows
```

---

## 6. Cài đặt & Chạy dự án

### Yêu cầu hệ thống
- **Node.js** phiên bản `20` trở lên (khuyến nghị Node.js `20` hoặc `24`).
- **PostgreSQL** (phiên bản `14+` hoặc `16`, đang chạy tại máy cục bộ hoặc qua Docker).

### Cách 1: Cài đặt và chạy thủ công (Môi trường phát triển)

#### Bước 1: Thiết lập Backend
```bash
cd back
npm install
```
Tạo tệp `.env` trong thư mục `back/` dựa trên tệp mẫu `back/.env.example`:
```bash
cp .env.example .env
```
Cập nhật tối thiểu 2 biến bắt buộc trong `back/.env`:
- `DATABASE_URL`: Chuỗi kết nối PostgreSQL (ví dụ: `postgresql://postgres:mat_khau@localhost:5432/student_life_hub`)
- `JWT_SECRET`: Chuỗi khóa bí mật ký JWT

Khởi tạo lược đồ cơ sở dữ liệu và chạy máy chủ Backend:
```bash
npx prisma generate
npx prisma migrate deploy   # hoặc dùng: npx prisma db push
npm run dev                 # Backend chạy tại http://localhost:5000
```

#### Bước 2: Thiết lập Frontend
Mở một cửa sổ terminal mới:
```bash
cd front
npm install
npm run dev                 # Frontend chạy tại http://localhost:5173
```
*(Mặc định trong môi trường dev, Vite tự động chuyển tiếp `/api` sang `http://127.0.0.1:5000`, không bắt buộc tạo `front/.env` trừ khi tách máy chủ API sang địa chỉ khác).*

#### Bước 3 (Tùy chọn): Tạo dữ liệu mẫu để trải nghiệm nhanh
Sau khi đã đăng ký một tài khoản trên giao diện web, bạn có thể nạp sẵn bộ dữ liệu mẫu đầy đủ (môn học, điểm số, thời khóa biểu, deadline, giao dịch, ngân sách và tài liệu ôn tập) cho tài khoản đó:
```bash
cd back
node scripts/seed-demo-user.cjs email_cua_ban@example.com
```

### Cách 2: Mở nhanh trên Windows (`Mo_LifeHub.cmd`)
Sau khi đã cài `node_modules`, tạo `back/.env` (trỏ tới cơ sở dữ liệu `student_life_hub` trên cổng `5432`) và đồng bộ Prisma:
- Nhấp đúp `Mo_LifeHub.cmd` ở thư mục gốc để tự động kiểm tra PostgreSQL, khởi chạy ngầm Backend (`5000`) + Frontend (`5173`) và mở trình duyệt.
- Nhấp đúp `Sao_Luu_CSDL.cmd` khi cần tạo bản sao lưu CSDL PostgreSQL local vào `improvement-backups/database-backups/`.

### Cách 3: Chạy bằng Docker Compose
```bash
docker compose up --build -d
```
- **Frontend (Nginx):** `http://localhost:3000`
- **Backend API:** `http://localhost:5000` (kiểm tra trạng thái tại `http://localhost:5000/api/health`, tài liệu API tại `http://localhost:5000/api-docs`)
- **PostgreSQL:** cổng `5432`

*(Lưu ý: Container `backend` tự động chạy `npx prisma migrate deploy` trước khi khởi động `node app.js` để đảm bảo lược đồ PostgreSQL luôn cập nhật).*

### Các biến môi trường tùy chọn quan trọng (`back/.env`)

| Biến môi trường | Ý nghĩa |
|---|---|
| `GEMINI_API_KEY` | Khóa API Google Gemini phục vụ tư vấn AI, AI Vision quét ảnh, sinh Quiz/Flashcard bằng AI và phân tích câu tự nhiên. |
| `GEMINI_MODEL` | Tên model Gemini sử dụng (mặc định: `gemini-3.5-flash-lite`). |
| `CHATBOT_AI_ENABLED` | Đặt `true` để bật kết nối tới Gemini API; nếu `false` hoặc không có khóa API, các chức năng tra cứu dữ liệu, RAG cục bộ, EdgeAI, SM-2, dự báo tài chính và bộ giải lịch ôn vẫn hoạt động độc lập. |
| `EMAIL_PROVIDER` | `smtp` (dùng `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`), `resend` (dùng `RESEND_API_KEY` + `EMAIL_FROM`), hoặc `mock` để ghi log thử nghiệm. |
| `ENABLE_CRON_JOBS` | Đặt `true` để bật lịch gửi email nhắc deadline (07:00) và cảnh báo ngân sách (08:00). |
| `SWAGGER_USER`, `SWAGGER_PASSWORD` | Nếu thiết lập cả hai, trang tài liệu API `/api-docs` sẽ yêu cầu xác thực HTTP Basic Auth. |

---

## 7. Kiểm thử tự động

### Kiểm thử đơn vị Backend (không cần kết nối mạng ngoài)
```bash
cd back
npm test -- tests/unit
```

### Kiểm thử Frontend (ESLint, Unit Tests & Kiểm định gói build PWA)
```bash
cd front
npm run lint
npm test -- --run
npm run test:pwa
```

### Kiểm thử tích hợp CSDL & Kiểm thử trình duyệt E2E (Playwright)
Các bài kiểm thử tích hợp và E2E yêu cầu biến `DATABASE_URL` trỏ tới một cơ sở dữ liệu PostgreSQL cục bộ dành riêng cho kiểm thử có hậu tố `_test` (cơ chế bảo vệ an toàn để không ghi đè dữ liệu thật):
```bash
# Ví dụ với PostgreSQL local có CSDL tên student_life_hub_test:
# PowerShell:
$env:DATABASE_URL="postgresql://postgres:mat_khau@127.0.0.1:5432/student_life_hub_test"

cd back
npx prisma migrate deploy
npm test

cd ../front
npm run test:e2e
```

---

## 8. Tài liệu tham khảo nội bộ

- [Trạng thái dự án (`PROJECT_STATUS.md`)](PROJECT_STATUS.md)
- [Thiết kế hệ thống (`docs/planning/SYSTEM_DESIGN.md`)](docs/planning/SYSTEM_DESIGN.md)
- [Hướng dẫn cấu hình Trợ lý AI (`docs/guides/CHATBOT_AI.md`)](docs/guides/CHATBOT_AI.md)
- [Hướng dẫn cơ chế RAG (`docs/guides/RAG.md`)](docs/guides/RAG.md)
- [Hướng dẫn PWA (`docs/guides/PWA_SETUP.md`)](docs/guides/PWA_SETUP.md)
- [Hướng dẫn sao lưu & khôi phục CSDL (`docs/guides/DATABASE_BACKUP_RESTORE.md`)](docs/guides/DATABASE_BACKUP_RESTORE.md)
- [Hướng dẫn triển khai Render (`docs/guides/RENDER_SETUP.md`)](docs/guides/RENDER_SETUP.md) & [Triển khai Production (`docs/guides/PRODUCTION_DEPLOY.md`)](docs/guides/PRODUCTION_DEPLOY.md)
