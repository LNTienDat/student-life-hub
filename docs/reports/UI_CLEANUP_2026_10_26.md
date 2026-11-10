# Làm gọn thông báo và thời khóa biểu — 26/10/2026

Chỉ cập nhật local, chưa push/deploy; dữ liệu người dùng không thay đổi.

## Thay đổi
- Bỏ thanh cảnh báo deadline vàng trong Layout và truy vấn riêng phục vụ thanh này. Giữ chuông, chấm chưa đọc, danh sách và đánh dấu đã đọc.
- Bỏ các khối cảnh báo học tập/ngân sách trùng với chuông trên Hôm nay cùng truy vấn chỉ dùng cho các khối đó.
- Hạn chót trong chuông chỉ hiển thị ngày/tháng/năm theo giờ Việt Nam. Giao diện lấy ngày từ thoiGian thay vì in trực tiếp mô tả có giờ, nên áp dụng được cả khi API đang trả mô tả cũ. Không đổi thời điểm hạn chót đã lưu.
- Bỏ nhập Excel/CSV khỏi trang thời khóa biểu. Giữ thêm thủ công, quét ảnh và nhập Excel/CSV ở Học tập.
- Theo lời làm rõ của người dùng, ô chọn Thứ nằm ở đầu từng khung môn, đúng vị trí Buổi 1/Buổi 2 cũ. Không còn ô Thứ lặp trong lưới nhập. Tên môn rộng hơn, giờ bắt đầu/kết thúc nằm cạnh nhau trên desktop. Không gom/thu gọn theo ngày.
- Các lỗi nhập liệu, cảnh báo ảnh chưa rõ/tạm ngưng và trạng thái vượt ngân sách trong phần chi tiết vẫn hiển thị tại nơi xử lý.

## Kiểm tra
- 55 kiểm thử frontend, lint, bản dựng và 8 kiểm thử PWA đạt.
- 11 nhóm trình duyệt đạt với OCR thật; API được mô phỏng để bảo vệ dữ liệu người dùng.
- Xác nhận không còn thanh vàng trên năm trang chi tiết, không lặp cảnh báo trên Hôm nay và không gọi API riêng của thanh vàng.
- Chuông hiện ngày đúng kể cả khi trình duyệt ở America/Los_Angeles; đọc/đánh dấu tất cả/điều hướng và giữ trạng thái sau tải lại hoạt động.
- Nhận diện đủ 6 dòng từ ảnh mẫu cũ. Đổi Thứ ở đầu khung, sửa tên, thêm/xóa dòng rồi lưu chỉ một yêu cầu, đúng nội dung đã sửa và không nhập buổi tạm ngưng.
- Kiểm tra desktop 1440px và mobile 390px/giao diện tối; không tràn ngang, không có lỗi JavaScript.
- Chưa thử thiết bị vật lý. Độ chính xác OCR còn các giới hạn trong báo cáo sửa OCR cùng ngày.

[Minh chứng](../qa/2026-10-26-ui-cleanup-browser.json)
[Khung chỉnh sửa desktop](../qa/ui-cleanup-timetable-desktop.png)
[Khung chỉnh sửa mobile](../qa/ui-cleanup-timetable-mobile.png)
[Thông báo mobile](../qa/ui-cleanup-notifications-mobile.png)
