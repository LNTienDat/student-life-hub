# Gửi email LifeHub
Cập nhật 28/10/2026.

Luồng quên mật khẩu và nhắc việc dùng chung dịch vụ email. Hiện hỗ trợ SMTP và Resend qua HTTPS. Gửi thất bại không đổi mật khẩu; liên kết chưa gửi được bị thu hồi. Không tự thử gửi lặp khi mất phản hồi.

## Local
Giữ EMAIL_PROVIDER=smtp, EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS và EMAIL_FROM. Thời gian chờ kết nối tối đa 10 giây, socket 12 giây.

## Render miễn phí
Render chặn các cổng SMTP 25, 465, 587: https://render.com/docs/free
Để gửi bằng HTTPS, cấu hình ở backend:
- EMAIL_PROVIDER=resend
- RESEND_API_KEY=khóa của tài khoản Resend
- EMAIL_FROM=địa chỉ người gửi được dịch vụ cho phép
- FRONTEND_URL=https://student-life-hub-web.onrender.com

Tài liệu endpoint: https://resend.com/docs/api-reference/emails/send-email
Kiểm tra hạn mức và quyền địa chỉ gửi/nhận trong tài khoản trước khi bật. Hỗ trợ phương thức gửi không đồng nghĩa đã tạo tài khoản dịch vụ, xác minh tên miền, hoặc chứng minh email vào hộp thư thật. Không đặt khóa trong biến VITE_*.

## Nghiệm thu
Dùng tài khoản thử do chính bạn quản lý: quên mật khẩu → nhận thư → mở liên kết → đổi mật khẩu → thử lại liên kết cũ (phải bị từ chối). Với lỗi mạng/hạn mức, hiện thông báo và không gửi lại âm thầm.
Máy chủ ngủ không đảm bảo chạy đúng giờ tác vụ nhắc việc. Thông báo trong biểu tượng chuông vẫn được kiểm tra khi dùng ứng dụng; cần hạ tầng chạy liên tục nếu muốn cam kết lịch gửi email.

Kiểm thử tự động dùng nhà cung cấp giả lập, không gửi thư thật.
