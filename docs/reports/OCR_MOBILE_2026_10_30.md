# OCR theo ảnh điện thoại — 30/10/2026

Đã triển khai online commit d4fd6c6; xem MOBILE_RELEASE_2026_10_30.md. OCR ảnh thật dưới đây được kiểm tra ở local trước triển khai. Không gửi ảnh sang dịch vụ AI; kiểm tra bằng Chrome với Tesseract chạy trên thiết bị.

## Bill Hoàng Phúc

Nguyên nhân: bộ phân tích chỉ hiểu Tổng cộng/Tổng tiền, bỏ qua nhãn Tổng: cùng ký tự rác phía trước. Bổ sung nhãn ngắn, giữ chặn các tổng mâu thuẫn và Tổng số lượng. Khi đọc đối chiếu khôi phục tên quán/danh mục rõ ràng, không lấy nguyên chữ OCR rác đưa vào mô tả.

Đọc đúng ảnh thật người dùng gửi: 54.000đ, 18/02/2019, Ăn uống, CÀ PHÊ HOÀNG PHÚC. Không lưu giao dịch thử vào CSDL.

## TKB

Ảnh 1280×534 có chữ nhỏ. Lượt đọc cả ảnh bỏ sót ký hiệu T2–CN nên trộn chữ giữa các cột. Thêm đọc riêng vùng tiêu đề, đối chiếu bộ tiếng Anh để nhận ký hiệu thứ; tên môn vẫn đọc tiếng Việt. Sửa bộ lọc không nhầm “Lộp trình” (OCR của Lập trình) thành metadata “lớp”. Đọc đối chiếu cột khi thiếu tên môn hoặc phòng.

Ảnh thật sau sửa có 6 buổi theo thứ [2,5,5,6,6,7], có đủ tên môn. Hai buổi chiều thứ 2/thứ 7 vẫn không đồng thuận giờ kết thúc (17:15 và 17:16), nên để trống giờ và đánh dấu cần kiểm tra. Một số dấu trong tên/phòng/giảng viên vẫn cần sửa tay; chưa tuyên bố OCR chính xác hoàn toàn. Không đoán hoặc tự lưu dữ liệu chưa rõ.

## Kiểm chứng

- 88 kiểm thử frontend đạt, lint/build đạt.
- OCR thực cả hai ảnh; kiểm tra tổng/ngày bill, số lượng buổi, thứ và tên môn Python bằng assertion.
- Kết quả gốc: improvement-backups/ocr-mobile-20261030/result.json (chỉ lưu tại máy, Git bỏ qua).
- Chưa kiểm thử lại trên điện thoại vật lý sau bản sửa; online vẫn bản 3801331.
