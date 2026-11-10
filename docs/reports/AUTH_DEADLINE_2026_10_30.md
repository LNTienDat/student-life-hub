# Mật khẩu, giao diện và deadline — 30/10/2026

## Đã thực hiện
- Nút hiện/ẩn mật khẩu rõ hơn ở Đăng nhập, Đăng ký, Hồ sơ và hai ô Đặt lại mật khẩu. Hai ô xác nhận có thể bật/tắt độc lập. Nút có nhãn cho trình đọc màn hình và trạng thái nhấn.
- Nút giao diện sáng/tối có trên Đăng nhập, Đăng ký, Quên mật khẩu và Đặt lại mật khẩu; dùng chung thiết lập đã lưu, không chồng nút cài ứng dụng.
- Email đặt lại mật khẩu giữ một liên kết “Đặt lại mật khẩu”. Trước đó cùng một đích được hiển thị hai lần. Liên kết vẫn có mã xác thực và thời hạn 15 phút.
- “Đã hoàn thành” thu gọn mặc định; bấm tiêu đề để mở.
- Tùy chọn tự xóa sau 24 giờ mặc định tắt, lưu theo tài khoản trên máy chủ. Bộ đếm tính từ thời điểm hoàn thành ở máy chủ, không lấy ngày hạn chót hay thời điểm mở trình duyệt.
- Chỉnh nội dung/đánh dấu hoàn thành lặp lại không đặt lại mốc. Hoàn tác xóa mốc; hoàn thành lại bắt đầu 24 giờ mới.
- Hết hạn chuyển vào “Đã xóa”; khôi phục về chưa hoàn thành. Tắt tùy chọn không làm mất mục đã nằm trong Đã xóa. Xóa vĩnh viễn vẫn cần hộp xác nhận.

## Cách đồng bộ 24 giờ
Khi đang mở trang Deadline, danh sách được kiểm tra mỗi 30 giây nếu bật tùy chọn. Khi trở lại cửa sổ hoặc tải danh sách, máy chủ chuyển các việc đã đủ 24 giờ vào Đã xóa. Không cần giữ một bộ đếm chạy liên tục trên thiết bị và không cần bật tác vụ gửi email. Nếu ứng dụng/máy chủ đang đóng hoặc ngủ, việc đồng bộ diễn ra ở lần truy cập kế tiếp; không cam kết xử lý nền đúng từng giây.
Bật tùy chọn cũng áp dụng cho việc cũ đã quá 24 giờ. Màn hình ghi rõ điều này. Các việc hoàn thành trước bản cập nhật được nhận mốc khởi đầu khi nâng cấp CSDL để tránh bị dọn bất ngờ; mặc định vẫn tắt.
Thùng Đã xóa này dùng cho các việc được tự xóa sau 24 giờ. Nút xóa thủ công hiện tại vẫn là xóa vĩnh viễn, có xác nhận rõ ràng.

## Kiểm tra
- Backend: 303/303, 38 bộ kiểm thử; dùng CSDL PostgreSQL riêng, kiểm tra bật/tắt, hết hạn, mốc máy chủ, khôi phục, quyền sở hữu và xóa vĩnh viễn.
- Frontend: 86/86; PWA/build: 8/8; lint và build đạt.
- Chrome: 10/10 luồng đạt; hai luồng mới cũng được kiểm lại sau khi chờ hiệu ứng giao diện hoàn tất. Kiểm thử Chrome được ghi ở docs/qa/2026-10-30-browser.json. Kích thước 390px chỉ là mô phỏng, chưa thay điện thoại thật.
- Nội dung email kiểm tra bằng nhà cung cấp mô phỏng; không gửi email thật trong đợt này.
- CSDL local đã sao lưu trước migration 20261030000000_deadline_completion_trash. Số bản ghi ở sáu bảng chính không đổi. Không cập nhật CSDL Neon, không đẩy GitHub, không triển khai online.

## Thử nhanh trên bản local
1. Mở http://127.0.0.1:5173/login, thử nút sáng/tối rồi tải lại. Bấm mắt ở ô mật khẩu.
2. Mở Đăng ký và link Đặt lại mật khẩu mới; thử từng mắt ở hai ô, bảo đảm ô còn lại giữ nguyên trạng thái.
3. Vào Deadline, hoàn thành một việc, bấm “Đã hoàn thành” để mở.
4. Bật “Tự xóa việc đã hoàn thành sau 24 giờ”: thấy đếm ngược. F5 vẫn giữ tùy chọn và mốc đếm.
5. Hoàn tác rồi hoàn thành lại: bộ đếm bắt đầu 24 giờ mới. Tắt để dừng tự xóa các việc còn lại.
6. Với việc đã đủ 24 giờ, mở “Đã xóa”, bấm Khôi phục: việc trở về danh sách cần hoàn thành. Chỉ bấm Xóa vĩnh viễn khi không cần giữ nữa.

Không cần tự chờ 24 giờ để xác minh logic: bài test dùng tài khoản giả và mốc thời gian giả trong CSDL thử; không thay đồng hồ máy hoặc dữ liệu thật.

## Bổ sung giao diện: cảnh báo ba ngày và chọn tuần
Nhãn đếm ngược của deadline chưa hoàn thành chuyển đỏ khi đến hạn trong tối đa ba ngày theo lịch Việt Nam hoặc đã quá hạn; không đổi mức ưu tiên đã lưu. Dùng chung quy tắc với cảnh báo trang Hôm nay. Phần chọn tuần bỏ hai nhãn chữ, giữ ô ngày và dùng các biểu tượng có aria-label/title. Hàng nút giữ thẳng trên 390px. Kiểm tra: 86 frontend, lint/build đạt; sáu kiểm tra giao diện/điều hướng dùng API mô phỏng đạt, không ghi dữ liệu thật. Bằng chứng: docs/qa/2026-10-30-deadline-week-style.json.
