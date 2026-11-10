# Sửa nhập thời khóa biểu từ ảnh — 26/10/2026

## Phạm vi
Chỉ cập nhật local; chưa commit, push hoặc triển khai. Không đổi dữ liệu người dùng, không gọi AI trả phí, không gửi ảnh lên dịch vụ bên ngoài.

## Thay đổi
- Đọc tiếng Việt riêng từng cột ngày thay vì gom chữ của cả bảng. Đọc lại các dòng giờ bằng chế độ chỉ nhận chữ số và đối chiếu kết quả.
- Xử lý đường kẻ đỏ giờ hiện tại, giữ các dòng chữ đỏ/cam (bao gồm thông báo nghỉ/tạm ngưng).
- Chỉ dùng gợi ý chính tả cho một danh sách cụm từ học thuật phổ biến và tên môn sẵn có trùng phần không dấu; không đoán tên giảng viên. Tên được gợi ý vẫn chỉnh sửa được và có thông báo kiểm tra.
- Khi chưa xác nhận được giờ: để trống, báo cần nhập lại và chặn lưu dòng được chọn. Không lấy giờ từ vị trí ô hay tự đảo giờ đầu/cuối. Người dùng có thể bỏ chọn dòng đó hoặc nhập lại giờ.
- Bỏ hàng tiêu đề “Buổi 1, Buổi 2…”. Chọn/bỏ chọn và xóa vẫn có nhãn trợ năng, nằm bên cạnh các trường.
- Giữ bước xem trước/chỉnh sửa và chỉ gửi dữ liệu khi bấm lưu. Cảnh báo giờ chưa rõ biến mất sau khi người dùng điền đủ giờ.

## Minh chứng và giới hạn
- Ảnh mới do người dùng gửi (tuần 26/10–1/11): đủ 6 buổi và 6 tên môn đúng dấu trong mẫu kiểm tra; 5 khoảng giờ đúng. Riêng Kỹ năng nghề nghiệp bị đường đỏ che: để trống thay vì điền sai. Người dùng cần nhập 13:00–17:15 theo ảnh gốc.
- Ảnh cũ (tuần 12–18/10): đủ 6 buổi, 6 tên môn và 6 khoảng giờ đúng; buổi Xử lý ảnh tạm ngưng vẫn tự bỏ chọn.
- Phòng học và tên giảng viên vẫn có lỗi OCR trên hai ảnh. Chưa cam kết đọc đúng ảnh mờ, ảnh nghiêng, mẫu bảng khác hay tên chuyên ngành ngoài danh sách gợi ý.
- Khoảng 4–7 giây/ảnh trên Chrome của máy kiểm tra; không phải cam kết tốc độ trên điện thoại.
- 55 kiểm thử frontend, 8 kiểm thử PWA/bản dựng, lint và build đạt.
- 10 nhóm kiểm tra trình duyệt: OCR thật, tên/thứ/giờ, bỏ đánh số, không ghi trước xác nhận, chặn giờ chưa rõ, bỏ chọn, sửa/thêm/xóa, màn hình 390px, lưu đúng dữ liệu đã sửa một lần, hủy OCR không có kết quả muộn/lỗi JavaScript.
- Trong kiểm tra giao diện, API được mô phỏng để tránh thay đổi dữ liệu thật; bộ OCR chạy thật bằng tài nguyên cùng nguồn.

[Minh chứng trình duyệt](../qa/2026-10-26-timetable-ocr-browser.json)
[Ảnh desktop](../qa/timetable-ocr-fix-desktop.png)
[Ảnh mobile mô phỏng](../qa/timetable-ocr-fix-mobile.png)

## Ghi chú kỹ thuật
Đã thử mô hình tessdata_best tiếng Việt chính thức nhưng không đưa vào sản phẩm: bản SIMD không tương thích và bản không SIMD chậm hơn, chưa khắc phục đủ lỗi trong mẫu. Giữ mô hình hiện có, cải thiện cách đọc và cho phép từ chối giờ không chắc chắn.
Tài liệu tham khảo: https://tesseract-ocr.github.io/tessdoc/Data-Files.html
