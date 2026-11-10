# Kiểm tra giao diện và thao tác mô phỏng — 25/10/2026

Đã kiểm tra frontend production build với API Express thật và PostgreSQL thử riêng. Dữ liệu giả; không gọi AI, gửi email hoặc cập nhật bản online.

## Những điểm đã sửa

- Chat giữ nút gửi và nút đóng trong cửa sổ thấp 300/420px. Khu vực lựa chọn chế độ tài liệu có thể cuộn khi thiếu chiều cao.
- Sau khi đóng chat bằng Escape, vị trí bàn phím trở về nút mở trợ lý.
- Thông báo có bề rộng phù hợp màn hình, chữ dễ đọc, nút đóng ít nhất 44×44px; hiển thị phía trên hộp thoại để không bị lớp nền làm mờ.
- Tên môn và phòng học dài xuống dòng trong thẻ thời khóa biểu, giữ nút sửa/xóa trong màn hình. Thông tin trên mobile dùng một cột ở màn hình hẹp.
- Ô nhập thời khóa biểu giới hạn tên môn 100, phòng 50, giảng viên 100 ký tự, đồng bộ giới hạn hiện có của backend.

## Kết quả kiểm tra hiện tại

- 60 tình huống trình duyệt đạt, không có lỗi JavaScript.
- 42 tình huống: 7 trang ở các bề rộng 320, 360, 390, 640, 768 và 1.280px, có dữ liệu và tên dài.
- 4 biểu mẫu thêm dữ liệu ở 320px, kiểm tra tràn ngang và ô/nút bị cắt.
- Chat ở 3 chiều cao 844, 420 và 300px; kiểm tra nút gửi/đóng nằm trong màn hình.
- Kiểm tra trả vị trí bàn phím khi đóng chat và thông báo có nút đóng bấm được.
- 7 trang ở 390px với giao diện tối.
- 2 luồng cảm ứng mô phỏng: sửa phòng học và ghi khoản chi 100000, hiển thị 100 000; xác nhận số liệu lưu trong CSDL thử.
- 48 kiểm thử logic frontend và 8 kiểm thử PWA/bản dựng đạt; lint và đóng gói production đạt. Không chạy lại backend vì đợt này chỉ đổi giao diện.

Kiểm tra ban đầu tái hiện 3 lỗi bằng tự động: nút gửi bị khuất ở chiều cao 300px, không trả vị trí bàn phím khi đóng chat, thông báo quá hẹp. Kiểm tra kích thước phần tử phát hiện thêm nút lịch học bị đẩy ra ngoài vùng nhìn dù trang không có thanh cuộn ngang; đã bổ sung kiểm tra trực tiếp các nút này.

Dữ liệu thử thao tác lưu dùng độ dài trong giới hạn backend. Lần thử trung gian dùng dữ liệu tự tạo vượt giới hạn bị backend từ chối đúng; đã sửa dữ liệu thử, không nới giới hạn nghiệp vụ.

## Cách chạy lại

Mã kiểm tra: [device.audit.cjs](../../front/tests/browser/device.audit.cjs).

Cần Chrome, Playwright Core và CSDL PostgreSQL local riêng có tên kết thúc bằng _test, đã áp dụng đủ migration. Không sử dụng CSDL người dùng thật. Cấu hình bằng SLH_DEVICE_TEST_DATABASE_URL; có thể đặt SLH_CHROME và SLH_PLAYWRIGHT_MODULE nếu đường dẫn máy khác.

Chạy từ thư mục dự án sau khi build frontend:

~~~powershell
node front/tests/browser/device.audit.cjs
~~~

Bộ kiểm tra tự tạo và xóa tài khoản giả. Cổng thử là 5093. Trong tiến trình thử, ngưỡng API được tăng lên 3.000 yêu cầu để chạy nhiều lần tải trang liên tiếp; cấu hình sản phẩm không thay đổi. Đây không phải phép thử cơ chế giới hạn yêu cầu.

## Bằng chứng

- [60 tình huống trình duyệt](../qa/2026-10-25-device-browser.json).
- [Tổng hợp phiên bản mã và kiểm tra](../qa/2026-10-25-device-summary.json).
- [Chat ở cửa sổ thấp](../qa/device-chat-short.png).
- [Thông báo trên mobile](../qa/device-toast-mobile.png).
- [Sửa lịch bằng cảm ứng mô phỏng](../qa/device-timetable-touch.png).

## Phần vẫn cần xác nhận thực tế

Mô phỏng trình duyệt không thay thế điện thoại vật lý. Chưa xác nhận camera, bàn phím thật, bàn phím đọc màn hình, cài PWA trên từng thiết bị hoặc hiệu năng OCR trên máy yếu. Cửa sổ cao 300px chỉ mô phỏng không gian bị thu hẹp, không tái tạo đầy đủ hành vi bàn phím Android/iOS. AI thật, email thật và bản online chưa được thử trong đợt này.

Các thay đổi hiện chỉ ở local, chưa push/deploy.
