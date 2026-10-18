# Student Life Hub — chuẩn bị triển khai Render

Ngày chuẩn bị: 18/10/2026. Mã nguồn đã được push lên nhánh `codex/student-life-hub-render` và có [bản nháp PR #1](https://github.com/LNTienDat/student-life-hub/pull/1). Chưa tạo dịch vụ Render và chưa chuyển dữ liệu local lên Internet.

## Phương án đã chuẩn bị

- Một web service mới tên `student-life-hub`, chạy giao diện và API ở cùng địa chỉ HTTPS.
- `render.yaml` đặt rõ gói `free`, tắt tự triển khai sau mỗi commit và tạo JWT secret ngẫu nhiên. Không tham chiếu bài tập `mern-frontend-235246`.
- Cơ sở dữ liệu: nhập `DATABASE_URL` của một PostgreSQL hosting riêng. Blueprint này không tự tạo cơ sở dữ liệu hoặc gói trả phí.
- Không copy dữ liệu hoặc `.env` trên máy bạn lên hosting. Các bản sao lưu local đã được bỏ qua khi đưa mã lên Git.

## Thứ tự thực hiện

1. Xem lại [PR #1](https://github.com/LNTienDat/student-life-hub/pull/1) trong GitHub `LNTienDat/student-life-hub`. Bản cập nhật nằm trên nhánh `codex/student-life-hub-render`; nhánh `main` vẫn ở commit `9c92175`. Khi thử triển khai, chọn đúng nhánh cập nhật này.
2. Chọn PostgreSQL hosting dành riêng cho Student Life Hub. Không trỏ vào cơ sở dữ liệu của bài tập khác. Nhập chuỗi kết nối trực tiếp trong Render; không đưa chuỗi kết nối vào GitHub hoặc nội dung công khai.
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
- Các script triển khai được kiểm tra cú pháp; chưa chạy pipeline cài đặt/build trong môi trường Render hoặc gửi Blueprint lên Render để xác minh cloud.
- CI dựng frontend trước, tạo PostgreSQL tạm, áp dụng migration và chạy kiểm thử. Xem kết quả chạy trên tab **Checks** của PR #1; kiểm thử local không thay thế xác minh trên cloud.
