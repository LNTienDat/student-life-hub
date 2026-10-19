# Student Life Hub — triển khai Render

Ngày cập nhật: 19/10/2026. Website đã chạy tại [student-life-hub-inx4.onrender.com](https://student-life-hub-inx4.onrender.com), dùng Render Free và Neon Free tại Singapore. Mã nguồn nằm trên nhánh `codex/student-life-hub-render`, trong [bản nháp PR #1](https://github.com/LNTienDat/student-life-hub/pull/1). Dữ liệu và tài khoản local chưa được chuyển lên online; người dùng đăng ký tài khoản mới trên website online.

## Dịch vụ đang sử dụng

- Render service: `student-life-hub`, ID `srv-dbafdh5g1s2s73btieh0`.
- Neon project: `student-life-hub`, ID `morning-credit-05388648`, nhánh `production`, PostgreSQL 18.
- Chủ dự án đã cho phép lưu kết nối Neon vào biến bí mật `DATABASE_URL` của Render. Giá trị thật chỉ được nhập trên Render, không lưu trong Git hoặc tài liệu này.
- Render đã build thành công, áp dụng đủ 5 migration và trả HTTP 200 tại `/api/health`. CI dùng PostgreSQL 16; lần triển khai thực tế đã áp dụng migration thành công trên Neon PostgreSQL 18.
- Tự deploy đã tắt: sau khi push bản sửa và kiểm thử đạt, chọn **Manual Deploy → Deploy latest commit** trên đúng service này.

## Phương án đã chuẩn bị

- Một web service mới tên `student-life-hub`, chạy giao diện và API ở cùng địa chỉ HTTPS.
- `render.yaml` đặt rõ gói `free`, tắt tự triển khai sau mỗi commit và tạo JWT secret ngẫu nhiên. Không tham chiếu bài tập `mern-frontend-235246`.
- Cơ sở dữ liệu: nhập `DATABASE_URL` của một PostgreSQL hosting riêng. Blueprint này không tự tạo cơ sở dữ liệu hoặc gói trả phí.
- Không copy dữ liệu hoặc `.env` trên máy bạn lên hosting. Các bản sao lưu local đã được bỏ qua khi đưa mã lên Git.

## Thứ tự thực hiện

1. Xem lại [PR #1](https://github.com/LNTienDat/student-life-hub/pull/1) trong GitHub `LNTienDat/student-life-hub`. Bản cập nhật nằm trên nhánh `codex/student-life-hub-render`; nhánh `main` vẫn ở commit `9c92175`. Khi thử triển khai, chọn đúng nhánh cập nhật này.
2. Tạo PostgreSQL trên Neon Free dành riêng cho Student Life Hub theo phần bên dưới. Nhập chuỗi kết nối trực tiếp trong Render; không đưa chuỗi kết nối vào GitHub hoặc nội dung công khai.
3. Trên Render chọn **New → Blueprint**, kết nối đúng repo Student Life Hub, nhánh đã được cập nhật và tệp `render.yaml` ở gốc repo.
4. Nhập `DATABASE_URL`, xem lại danh sách tài nguyên và giá trước khi bấm tạo. Định nghĩa hiện chỉ tạo một web service `free`; không chứa database, worker, cron hoặc dịch vụ của bài tập khác.
5. Sau khi triển khai, kiểm tra URL HTTPS do Render cấp, `/api/health`, đăng ký/đăng nhập, lưu deadline, nhập tệp và cài PWA trên điện thoại.

Nếu tạo Web Service thủ công thay Blueprint:

| Mục | Giá trị |
|---|---|
| Repository | `LNTienDat/student-life-hub` |
| Root Directory | Để trống (gốc repo) |
| Runtime | Node |
| Build Command | `node scripts/render-build.mjs` |
| Start Command | `node scripts/render-start.mjs` |
| Health Check Path | `/api/health` |
| Plan | Free |

Cần khai báo các biến giống `render.yaml`; JWT_SECRET phải là giá trị ngẫu nhiên riêng, không dùng giá trị mẫu. `FRONTEND_URL` tự lấy từ `RENDER_EXTERNAL_URL`; khi dùng tên miền tùy chỉnh, đặt FRONTEND_URL thành địa chỉ HTTPS đó.

## PostgreSQL cho bản thử nghiệm: Neon Free

Neon Free đã được tạo và kết nối cho bản thử nghiệm. Các bước dưới đây ghi lại cách thiết lập khi cần tái tạo môi trường:

1. Mở [Neon Console](https://console.neon.tech), đăng nhập hoặc tự hoàn tất đăng ký nếu chưa có tài khoản.
2. Tạo project `student-life-hub` trên gói **Free**, chọn khu vực gần Render Singapore nhất trong danh sách hiện có. Dùng PostgreSQL 16 nếu có, cùng phiên bản đã kiểm thử trên GitHub.
3. Mở **Connect**, chọn cơ sở dữ liệu của project mới. Với cấu hình hiện tại, dùng kết nối **Direct / Unpooled** (tắt Connection pooling). Ứng dụng dùng chung `DATABASE_URL` cho Prisma Client và migration, nên kết nối trực tiếp là phương án đơn giản cho một máy chủ thử nghiệm.
4. Giữ `sslmode=require` trong URL. Có thể thêm `connect_timeout=15&connection_limit=5` vào query string để chờ cơ sở dữ liệu thức dậy và giới hạn số kết nối của máy chủ nhỏ. Các tham số query được nối bằng `&`; không thêm dấu `?` lần thứ hai.
5. Dán URL thật vào biến bí mật `DATABASE_URL` khi tạo Blueprint Render. Không thay URL trong `back/.env` local. Không dán mật khẩu hay URL kết nối vào chat, PR hoặc tệp được theo dõi bởi Git.
6. Lần khởi động Render đầu tiên sẽ tạo cấu trúc bảng bằng các migration đã lưu. Cơ sở dữ liệu online bắt đầu trống; dữ liệu local chỉ được chuyển khi chủ dự án yêu cầu riêng.

Không cần nâng cấp Prisma để kết nối Neon. Nếu sau này dùng kết nối pooled, cần cấu hình riêng kết nối trực tiếp cho migration rồi kiểm thử trước khi đổi biến trên hosting.

Neon Free vẫn có hạn mức dung lượng/tài nguyên và có thể tạm dừng compute khi không hoạt động; xem hạn mức trong Console trước khi đưa cho nhiều người dùng. Không chọn nâng cấp trả phí hoặc nhập thẻ nếu chưa được chủ dự án đồng ý.

Nguồn đối chiếu ngày 18/10/2026: [Neon Free](https://neon.com/blog/neon-free-plan-1-gb-per-project), [Neon và Prisma](https://neon.com/docs/guides/prisma).

## Cách hoạt động của bản triển khai

Build cài các phụ thuộc có khóa phiên bản, dựng frontend với API `/api` và sinh Prisma Client. Start kiểm tra cấu hình, áp dụng các migration còn thiếu rồi mới mở máy chủ. Lệnh này chỉ dành cho hosting đã chọn; không chạy nó để thay thế hai terminal local đang dùng.

Backend chỉ phục vụ frontend khi `SERVE_FRONTEND=true`. Luồng `npm run dev` hiện có vẫn chạy riêng frontend và backend. Tệp HTML và service worker được kiểm tra cập nhật; tài nguyên đã có mã hash được cache dài hạn. Các script khởi tạo giao diện và trang mất mạng đã chuyển thành tệp cùng nguồn để hoạt động với Content Security Policy của máy chủ.

## Giới hạn cần biết trước khi tạo tài nguyên

- Render Free có thể ngủ sau thời gian không hoạt động, nên lần mở đầu có thể chậm. Gói miễn phí của workspace dùng chung hạn mức; bài tập khác đang chạy cũng có thể dùng hạn mức đó.
- PostgreSQL miễn phí của Render **hết hạn sau 30 ngày**, không phù hợp để hứa lưu dữ liệu lâu dài. Nếu chọn dùng, chỉ coi là thử nghiệm và cần có kế hoạch chuyển/lưu dữ liệu trước khi hết hạn.
- Render Free chặn SMTP trên các cổng 25/465/587. Cấu hình này tắt cron email; email đặt lại mật khẩu chưa sử dụng được nếu chưa thêm dịch vụ email qua HTTPS API hoặc phương án hosting phù hợp.
- Chatbot cần `GEMINI_API_KEY` riêng được nhập trong Render. Không đặt khóa trong frontend hoặc GitHub.
- PWA chưa hỗ trợ nhập/sửa dữ liệu offline. Việc đưa web online không tự đáp ứng toàn bộ yêu cầu phát hành Google Play.

Các giới hạn Render được đối chiếu ngày 18/10/2026: [Free](https://render.com/docs/free), [Blueprint](https://render.com/docs/blueprint-spec), [Environment variables](https://render.com/docs/environment-variables).

## Xác minh đã làm

- Đối chiếu mã commit nhánh main từ GitHub bằng thao tác chỉ đọc.
- Bản dựng và 7 kiểm thử PWA đạt; 7 kiểm thử logic frontend đạt.
- 55 kiểm thử backend đạt, gồm kiểm tra phục vụ SPA, cache của service worker, CSP, API và PostgreSQL local.
- Blueprint đã được Render chấp nhận; script build/start đã chạy thành công trên Render với cơ sở dữ liệu Neon riêng.
- CI dựng frontend trước, tạo PostgreSQL tạm, áp dụng migration và chạy kiểm thử. Xem kết quả chạy trên tab **Checks** của PR #1; kiểm thử local không thay thế xác minh trên cloud.

## Bản vá thư viện ngày 19/10/2026

- Cập nhật lockfile trong phạm vi tương thích hiện tại: `proxy-addr` 2.0.8, `nodemailer` 10.1.6, `ip-address` 10.7.4 và hai phiên bản phụ thuộc `brace-expansion` 1.1.21/2.1.7.
- 55 kiểm thử backend đạt sau cập nhật. `npm audit --omit=dev` còn 2 cảnh báo mức trung bình (`exceljs` và phụ thuộc `uuid`), không còn mức cao/nghiêm trọng tại thời điểm kiểm tra.
- Cảnh báo UUID liên quan các hàm v3/v5/v6 nhận buffer. Mã ExcelJS hiện được kiểm tra chỉ gọi v4; chưa nâng cấp cưỡng bức hoặc hạ phiên bản ExcelJS để làm mất cảnh báo. Cần tiếp tục theo dõi bản vá upstream; kết quả audit này không phải cam kết không còn mọi rủi ro.
