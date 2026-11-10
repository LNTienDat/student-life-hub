# Bố cục thêm nhanh và học kỳ — 27/10/2026

Chỉ local; chưa commit/push/deploy. Lần này chỉ sửa giao diện, không thay API/schema hoặc ghi dữ liệu người dùng thật.

- Hôm nay bỏ toàn bộ thanh học kỳ và các thao tác đổi/xóa. Học kỳ đang học của tài khoản vẫn dùng để tự điền khi thêm môn/lịch mới.
- Học tập và Thời khóa biểu dùng chung thanh gọn: Học kỳ đang học ở trái; Xem dữ liệu ở phải. Xem kỳ cũ không đổi kỳ đang học.
- Đổi học kỳ mở hộp riêng có tên kỳ, gợi ý kỳ đã có, Hủy/Áp dụng. Giữ dữ liệu cũ; không cần ngày kết thúc. Lỗi lưu giữ lại nội dung đang nhập.
- Icon xóa nằm cạnh ô học kỳ đang xem, mở xác nhận phạm vi/số lượng và nhập tên như trước. Hủy không xóa dữ liệu.
- Thêm việc: tên công việc toàn hàng; ngày/giờ và ưu tiên cùng hàng ở máy tính, xếp lại trên điện thoại. Bật giờ không tạo vùng trống lớn; nút Lưu đặt cuối bên phải. Giữ nháp và dữ liệu ngày/giờ/ưu tiên khi chuyển trang.

## Kiểm tra

- ESLint và build đạt; 73 kiểm thử frontend, 8 kiểm thử PWA/bản dựng đạt.
- 8 nhóm Chrome đạt bằng UI Vite thật và API/phiên giả lập riêng: vị trí điều khiển, bố cục ngày/giờ/ưu tiên, giữ nháp và payload, hủy/áp dụng/lỗi đổi kỳ, tách kỳ đang học/kỳ đang xem, hủy xóa, mobile 320/390px, cùng điều khiển trên TKB.
- Không phát hiện lỗi JavaScript trình duyệt. Đã xem ảnh bố cục desktop/mobile và hộp đổi kỳ ở giao diện tối.
- Bài kiểm tra chuyển trang chờ trang đích hiển thị trước khi thao tác tiếp để tránh bấm Hôm nay khi Học tập chưa mở xong.
- Backend không đổi nên không chạy lại bộ kiểm thử backend trong lượt này. T21/T22 vẫn chưa được người dùng tự kiểm; đây không phải xác nhận kiểm thử trên thiết bị vật lý hoặc bản online.

[Kết quả trình duyệt](../qa/2026-10-27-compact-semester-browser.json) · [Thêm việc desktop](../qa/compact-quick-time-desktop.png) · [Học kỳ desktop](../qa/compact-semester-study-desktop.png) · [Học kỳ mobile](../qa/compact-semester-study-mobile-dark.png) · [Hộp đổi học kỳ](../qa/compact-semester-dialog-mobile-dark.png).

Kịch bản/log: improvement-backups/compact-semester-20261027. Local: http://127.0.0.1:5173/dashboard.
