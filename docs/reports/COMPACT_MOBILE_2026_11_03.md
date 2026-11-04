# Giao diện nhập ảnh và hỏi lịch học — 03/11/2026

## Thay đổi

- Hộp bỏ bản nháp: rút gọn tiêu đề, mô tả và hai nút cùng hàng.
- Giao dịch: Hủy/Lưu bằng nhau trên điện thoại; hộp quét hóa đơn chỉ còn mô tả ngắn và Chọn ảnh/Chụp ảnh cùng hàng.
- TKB: Nhập ảnh đặt cạnh Thêm buổi học, mở hộp chọn ảnh/camera. Bản nháp và nhận diện vẫn tồn tại khi chuyển trang.
- Thẻ môn trên điện thoại: thông tin lên trước, thao tác xuống dưới; giảm khoảng trống.
- Chatbot nhận các câu “mai học môn gì”, “mai có lịch không”, “hôm nay có học không”. Kết quả dùng dữ liệu tài khoản và ngày Việt Nam.
- OCR thử thêm cách phân đoạn cột khi lượt đọc thiếu tên môn; ghép theo vị trí dòng giờ, không tự đoán thứ hoặc giờ chưa chắc chắn.

## Kiểm tra

- 95 kiểm thử frontend đạt; lint và build đạt.
- 26 kiểm thử chatbot backend đạt, gồm câu hỏi ngày mai và ranh giới ngày Việt Nam.
- 3 kiểm thử trình duyệt đạt: hội thoại dữ liệu/tài liệu; OCR ảnh ba môn và giữ bản nháp qua các trang; căn nút và hộp chọn ảnh ở 390 × 844.
- Dùng cơ sở dữ liệu thử riêng, đã dọn sau kiểm thử. Không gọi AI Google, không gửi email.

## Giới hạn

- OCR chưa bảo đảm đúng mọi ảnh; ảnh nhỏ/mờ có thể cần sửa thủ công trước khi lưu.
- Tư vấn AI tự do vẫn tắt; chưa xác minh Free Tier/Billing. Tra cứu dữ liệu và tài liệu không phụ thuộc việc bật Gemini.
- Đây là thay đổi local, chưa đẩy GitHub hoặc triển khai online trong lượt này.
