# Sửa giới hạn yêu cầu khi kiểm thử — 25/10/2026

Ảnh người dùng gửi cho thấy trang Học tập bị HTTP 429 từ giới hạn API chung. Trước đây mọi yêu cầu dùng chung 300 lượt/15 phút/IP. Trong phép đo Vite development có React StrictMode, một lần mở Học tập dùng 14 yêu cầu; nhiều lần tải lại và chuyển tab có thể chạm mức cũ.

Đã sửa:
- Giới hạn chung vẫn hoạt động: 1.200 lượt/15 phút/IP ở bản thông thường, 3.000 ở NODE_ENV=development.
- GET/HEAD /api/health dùng giới hạn độc lập 120 lượt/phút/IP; không chiếm lượt tải dữ liệu.
- OPTIONS không tiêu hao hạn mức nghiệp vụ.
- HTTP 429 có mã RATE_LIMITED, số giây cần chờ và Retry-After tương ứng.
- Giữ giới hạn riêng đăng nhập 10 lượt/15 phút và chatbot 20 lượt/5 phút.

Đã khởi động lại backend local, xóa bộ đếm tạm trong bộ nhớ. Phiên đăng nhập và dữ liệu người dùng được giữ nguyên. Không sửa logic đăng xuất sau khi người dùng xác nhận Quay lại vẫn ở trang login.

Kiểm thử:
- 200/200 backend đạt, gồm 7 bài mới kiểm tra 429, Retry-After, tách quota health và giới hạn đăng nhập.
- Trình duyệt dùng Vite development thật, Express thật, PostgreSQL thử riêng; tài khoản giả, không gọi AI/email.
- 400 yêu cầu trước khi mở UI vượt mức cũ mà không bị 429 với hạn mức production mới; không nâng hạn mức riêng trong phép thử này.
- Học tập tải đúng môn; không phát sinh yêu cầu lặp trong 4 giây đứng yên.
- 12 lần tải lại liên tiếp vẫn có dữ liệu. Tổng 614 yêu cầu, 0 phản hồi 429, 0 lỗi JavaScript trong kịch bản này.
- Đăng xuất rồi browser Back vẫn ở login, token đã bị xóa.
- API health local và qua Vite đều HTTP 200 sau khởi động lại.

Bằng chứng: [Backend](../qa/2026-10-25-rate-limit-backend.json), [trình duyệt](../qa/2026-10-25-rate-limit-browser.json).
Bản sửa hiện ở local, chưa push/deploy. Các ngưỡng mới không phải cam kết không bao giờ bị giới hạn; khi vượt ngưỡng máy chủ vẫn trả 429.
