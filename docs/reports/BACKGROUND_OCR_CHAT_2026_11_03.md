# OCR nền, trò chuyện thống nhất và khung deadline — 03/11/2026

## Thay đổi

- Tác vụ quét TKB và bản nháp thuộc phiên tài khoản, tách khỏi vòng đời trang. Chuyển Hôm nay/Học tập/Deadline/Tài chính không hủy quét. Có tiến trình và liên kết quay về kiểm tra/lưu. Ẩn khung nhập ảnh không hủy tác vụ; Dừng đọc mới hủy. Đăng xuất/đổi tài khoản hủy tác vụ, thu hồi URL ảnh và bỏ dữ liệu riêng.
- Đọc riêng dải tiêu đề để tránh gộp môn giữa cột. Đọc đối chiếu mọi cột và khôi phục buổi bị bỏ sót. Nếu chữ thứ mất nhưng còn lưới bảy cột rõ, dùng đường kẻ để tách môn; không tự gán thứ khi chưa đọc chắc.
- Chatbot chỉ còn một cuộc trò chuyện, tự tra dữ liệu hoặc tài liệu. Hỏi hướng dẫn nhập/sửa/xóa không bị trả nhầm số liệu hiện tại. AI nằm trong tùy chọn thu gọn, chỉ gửi Google sau đồng ý rõ ràng và khi máy chủ đã bật. Lịch sử gửi AI chỉ chứa cặp hỏi/đáp AI, không mang theo tài liệu riêng hoặc kết quả tra dữ liệu.
- Hai khung Đã hoàn thành và Đã xóa có cùng nền, viền, khoảng đệm, chiều cao tiêu đề và cỡ chữ.

## Kiểm tra

- 95 kiểm thử frontend; lint đạt.
- 22 kiểm thử chatbot controller/service đạt; Google AI được giả lập trong kiểm thử, không gọi AI thật.
- Chrome 390×844, CSDL thử độc lập: hai kiểm thử trình duyệt đạt. Quét ảnh thật, chuyển mục trong lúc quét, nhận đủ ba buổi, sửa bản nháp rồi chuyển qua lại vẫn giữ sửa đổi. Một cửa sổ chat trả lời GPA và truy xuất hướng dẫn TKB, giữ cả hai câu trả lời. Hai khung deadline khi đóng có cùng chiều rộng/chiều cao.
- Ảnh TKB gốc: 3 buổi (Python thứ 2, Xử lý ảnh và UML thứ 6). Giờ Python chưa chắc nên cần xác nhận.
- Bản JPEG thu còn 75%: tách 3 buổi; chữ và thứ cần sửa. Bản thu còn 50%: không nhận ra buổi. Không bảo đảm đọc đúng mọi ảnh nhỏ/nén.

## Giới hạn vận hành

Quét chạy trong trình duyệt bằng Web Worker, không tải ảnh lên máy chủ. Chuyển mục trong LifeHub vẫn xử lý. Khi chuyển tab trình duyệt hoặc khóa màn hình, hệ điều hành có thể tạm dừng tab; không bảo đảm xử lý liên tục nếu hệ thống đình chỉ/đóng tab. Bản nháp trong bộ nhớ không sống qua tải lại/đóng trình duyệt. Không tự lưu các buổi sau OCR.
