# Sửa theo kiểm thử PC — 28/10/2026

## Kết quả
- Hai ảnh hóa đơn mới được quét bằng OCR thật trong Chrome:
  - Gái Garden: 1.916.000đ, 07/05/2023, Ăn uống.
  - Xăng dầu: 500.000đ, 17/04/2019, Đi lại.
- Hỗ trợ ngày ghi “thg/tháng”, gồm lỗi OCR “thợ” trong cấu trúc ngày đã xác định.
- Không xem ký tự nhận sai ở dòng số lượng/thẻ là ký hiệu ngoại tệ. Với tổng tiền chưa rõ, đọc đối chiếu bằng hai cách chia dòng của bộ nhận diện tiếng Anh; chỉ thay tổng theo kết quả đồng thuận, không tính tiền bằng cách đoán.
- Thiếu ngày vẫn để trống và cảnh báo; người dùng phải kiểm tra trước khi lưu.
- Đổi mô tả thành “Ảnh chỉ được xử lý trong trình duyệt, không tải lên máy chủ.” Ảnh gốc không được ứng dụng tải lên máy chủ; dữ liệu đã xác nhận mới được gửi khi lưu. Việc chọn ảnh không tự lưu một bản ảnh mới vào thiết bị.
- Hộp quét hóa đơn: hai nút bằng nhau, cùng hàng trên desktop; xếp dọc trên màn hình hẹp; nút Đóng ở góc phải dưới. Đã xem ảnh chụp 1440px và 390px.
- Nhắc thiếu học kỳ của TKB chỉ hiện một dòng gần nút lưu. Lỗi tên/giờ/trùng lịch vẫn nằm ở dòng tương ứng. Khi chưa có học kỳ, không so với lịch cũ có phạm vi chưa xác định.
- Học kỳ đã nhập được lưu riêng trong tài khoản, kể cả chưa có môn/lịch. Đổi HK1 sang HK2 không làm mất HK1. Có danh sách chọn học kỳ đã lưu rõ ràng, không phụ thuộc gợi ý của trình duyệt.
- Xóa học kỳ cũng xóa khỏi danh sách đã lưu; không ảnh hưởng tài khoản khác. Sửa lỗi thử lại giao dịch khi hai tab đổi học kỳ cùng lúc.
- Migration 20261028010000_saved_semesters đã áp dụng local sau sao lưu. Số bản ghi trước/sau giữ nguyên. Đã nạp lại backend; health ok và frontend 200.
- Học kỳ từng nhập trước bản sửa nhưng chưa hề lưu ở CSDL/dữ liệu môn/lịch không thể tự phục hồi tên; nhập lại một lần sẽ được giữ từ đây.

## Bằng chứng
- Backend: **298/298** kiểm thử đạt.
- Frontend: **80/80** kiểm thử đạt.
- PWA/build: **8/8**, lint đạt.
- [Backend JSON](../qa/2026-10-28-pc-feedback-backend.json)
- [OCR ảnh thật](../qa/2026-10-28-pc-feedback-ocr.json)
- [Kiểm tra giao diện](../qa/2026-10-28-pc-feedback-browser.json)
- [Xác nhận migration local](../qa/2026-10-28-pc-feedback-local-migration.json)
- [Hộp quét trên PC](../qa/pc-feedback-receipt-1440.png)
- [Hộp quét ở màn hình hẹp](../qa/pc-feedback-receipt-390.png)

CSDL thử cổng 55462 đã dừng và dọn. Tài khoản kiểm thử giao diện đã xóa khỏi CSDL thử. Bản sao lưu local nằm trong thư mục improvement-backups/database-backups bị loại khỏi Git.

## Người dùng thử tiếp
1. Mở local, Ctrl+F5; chọn lại hai ảnh hóa đơn mới.
2. Nhập lịch từ ảnh, để học kỳ trống: chỉ một nhắc nhở gần nút lưu; điền học kỳ thì nhắc biến mất.
3. Chọn HK1, đổi HK2; mở “Học kỳ đã lưu”, chọn HK1; tải lại để kiểm tra.
4. Kiểm tra nút chọn/chụp ảnh và Đóng đã cân đối.

Chỉ ghi nhận người dùng đang thực hiện bước 1 (PC). AI thật, email thật, điện thoại thật và online vẫn chưa được người dùng nghiệm thu. Đợt này chưa đẩy GitHub, deploy hoặc thay đổi Neon.
