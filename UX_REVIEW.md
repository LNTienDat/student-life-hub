# Rà soát trải nghiệm và lỗi — 20/10/2026

## Mục tiêu và phạm vi

Giúp sinh viên nhìn ra việc cần làm trước, đọc rõ trên cả nền sáng/tối và thao tác trên điện thoại. Thay đổi chỉ trong dự án Student Life Hub. Dữ liệu kiểm tra UI là dữ liệu giả ở local; không ghi vào tài khoản online hoặc cơ sở dữ liệu thật.

## Các thay đổi giao diện

- Thu gọn phần chào thành tiêu đề và một hành động chính; đổi nhãn Dashboard thành Hôm nay.
- Đưa việc cần ưu tiên lên trước lịch học trong thứ tự đọc; giảm trang trí và kích thước thẻ tổng quan.
- Biểu đồ và giải thích cách tính ngân sách có thể mở khi cần.
- Thanh điều hướng bỏ các cột cố định quá rộng; menu riêng cho màn hình dưới 1024px, nhãn trang đang xem và nút thao tác tối thiểu 44px trong phần điều hướng.
- Điều chỉnh nền, chữ phụ và màu liên kết ở chế độ tối; ô nhập trên điện thoại dùng cỡ chữ 16px.
- Cho phép ẩn lời mời cài ứng dụng trong phiên hiện tại; bỏ yêu cầu cấp quyền thông báo tự động.
- Hộp xác nhận hiển thị qua portal, khóa cuộn nền, giữ focus, hỗ trợ Escape và trả focus về thao tác trước đó. Cửa sổ trợ lý giới hạn theo chiều rộng/cao thiết bị.

## Lỗi đã sửa và nguyên nhân

| Lỗi quan sát được | Cách sửa |
| --- | --- |
| Tìm kiếm, phân trang và lọc tháng Tài chính không có tác dụng | Gửi đúng q/trang/soLuong/thang/nam và đọc trang/soTrang của API |
| Ngân sách biến mất sau thêm giao dịch, xu hướng vẫn dữ liệu cũ | Đọc ketQua và tải lại đồng thời thống kê, ngân sách, xu hướng sau lưu/xóa |
| Kết quả của bộ lọc cũ có thể ghi đè bộ lọc vừa chọn | Dùng phiên bản yêu cầu để loại kết quả cũ |
| Không có thao tác đặt ngân sách mặc dù dashboard hướng dẫn đặt | Bổ sung form danh mục/hạn mức; lưu cập nhật đúng người dùng, danh mục và tháng bằng upsert |
| Ngày tối đa của giao dịch lệch một ngày vào đầu ngày ở Việt Nam | Dùng ngày địa phương thay chuỗi ngày UTC |
| Trang 404 bị lỗi khi render | Bổ sung import Link bị thiếu |
| Xác nhận xóa buổi học thiếu thông tin | Truyền label/value/extra đúng cấu trúc component |
| Tải môn học/deadline/lịch học thất bại nhưng hiển thị như không có dữ liệu | Thông báo lỗi với nút thử tải lại |
| Bấm lưu liên tiếp có thể tạo dữ liệu trùng | Khóa submit bằng ref và trạng thái đang lưu |
| Điểm, tín chỉ, số tiền sai định dạng bị cắt thành số hợp lệ | Đọc toàn bộ số, chặn NaN/Infinity/boolean/array và tín chỉ lẻ |
| Sửa ngày giao dịch không được lưu | Ghi ngày đã kiểm tra hợp lệ vào dữ liệu cập nhật |
| Sửa một giờ có thể tạo buổi học kết thúc trước bắt đầu | Kiểm tra hai giờ với bản ghi hiện tại và định dạng HH:mm |

## Minh chứng kiểm tra

- ESLint: đạt, không còn lỗi/cảnh báo tại lần kiểm tra trước khi hoàn tất.
- Backend unit: 69 kiểm thử đạt (bao gồm kiểm thử hồi quy nhập liệu và phạm vi người dùng).
- Frontend logic: 10 kiểm thử đạt; PWA: 7 kiểm thử đạt; build production đạt.
- Bổ sung kiểm thử API với PostgreSQL trong CI cho tìm kiếm, phân trang, ngân sách lưu lại và dữ liệu giữa hai tài khoản.
- Thử trình duyệt local: chuyển trang giao dịch, tìm Sách đặt lại trang, đổi hạn mức 1.500.000 thành 1.800.000, ghi khoản chi 25.000 và kiểm tra tổng chi/ngân sách cập nhật.
- Thử bàn phím: focus ban đầu vào Hủy, Tab/Shift+Tab nằm trong hộp xác nhận, Escape đóng và trả focus.
- Kiểm tra chiều rộng: Hôm nay 320/390px và Tài chính 768px không tràn ngang; cửa sổ trợ lý nằm trong màn hình 320px.

## Giới hạn

Đây là một đợt rà soát, không bảo đảm mọi lỗi đã được phát hiện. Chưa thử trên điện thoại vật lý, chưa có khảo sát người dùng. Email khôi phục mật khẩu và khóa dịch vụ AI online vẫn cần cấu hình như đã ghi trong RENDER_SETUP.md. Việc kiểm tra UI dùng API giả để giữ dữ liệu thật an toàn; kiểm thử tích hợp với PostgreSQL do CI xác nhận riêng.
