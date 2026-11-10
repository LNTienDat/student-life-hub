# Sửa theo kiểm thử người dùng — 27/10/2026

Chỉ local, chưa commit/push/deploy. Các yêu cầu mới thay thế quy tắc cũ về danh mục được bảo vệ.

## Danh mục
- Ăn uống, Đi lại, Khác là gợi ý ban đầu, nay đều có bút sửa và thùng rác.
- Đổi tên giữ mã và lịch sử. Xóa chỉ ẩn khỏi lựa chọn mới, không xóa giao dịch/ngân sách.
- **Quản lý → Đã bỏ khỏi danh sách** luôn hiện; nếu rỗng có lời giải thích, nếu có mục đã xóa thì có Khôi phục.
- Bỏ + Thêm danh mục khỏi select; chỉ thêm trong Quản lý.
- Xóa hết danh mục: biểu mẫu chuyển sang lựa chọn rỗng bắt buộc, không tự thêm lại Khác hoặc gửi một mã danh mục ngầm. Có thể thêm/khôi phục rồi tiếp tục nhập.
- Nháp tạo mới tránh chọn danh mục đã ẩn; khi sửa giao dịch cũ vẫn giữ được danh mục đã ẩn.
- Khác của Thu nhập và Chi tiêu có thể sửa/ẩn độc lập. Tên hiển thị, tìm kiếm, bộ lọc và Excel lấy đúng loại, đúng tài khoản.
- Migration **20261027000000_edit_starter_categories** đổi ràng buộc duy nhất sang tài khoản + loại + mã. Đã áp dụng vào localhost:5432/student_life_hub và tạo lại Prisma Client; không chạy lên Neon, không xóa hoặc đổi các giao dịch thật.

## OCR hóa đơn
Đã tái hiện bằng đúng ảnh mau-bill-an-uong-6_1597330928.jpg: nền gỗ bị đọc lẫn, ngày và tổng tiền không được điền.

Bản sửa tìm vùng giấy sáng lớn khi đủ tin cậy, phóng ảnh, tăng tương phản và dùng ngưỡng thích ứng cho vùng bị bóng. Dòng T.Cộng có cột số lượng được tách khỏi số tiền; hỗ trợ TIỀN MẶT ở mức ưu tiên thấp hơn tổng phải trả và dấu gạch chéo OCR khác mã Unicode.

OCR thật trong trình duyệt hiện cho:
- Tên: **VINH NGUYEN RES**.
- Chi tiêu / Ăn uống.
- Số tiền: **225 000đ**.
- Ngày: **29/03/2019**, theo ảnh; không tự sửa thành năm 2026.
- Kiểm tra thêm mẫu CƠM SINH VIÊN trước đây: vẫn nhận 20 000đ và 26/10/2026, không lấy tiền khách đưa 50 000đ.

Ẩn phần Xem chữ nhận diện khỏi giao diện chính; giữ Xem ảnh hóa đơn và biểu mẫu sửa trước khi lưu. OCR chạy cục bộ, không gọi AI trả phí, không tự lưu giao dịch. Đây không phải bảo đảm đọc đúng mọi ảnh. Hóa đơn mẫu năm 2019 nếu được xác nhận lưu sẽ thuộc tháng 3/2019, không cộng vào tổng tháng 10/2026.

## TKB
- Đổi tên nút thành **Xóa lịch hiện tại**. Hộp xác nhận vẫn ghi rõ phạm vi học kỳ/lịch lặp đang xem và các tuần liên quan.
- Bút sửa là cập nhật lịch lặp hằng tuần; bổ sung lời giải thích ngay trên form.
- Kiểm tra thật: sửa Toán từ 07:00–09:00 thành 07:30–08:30, tuần sau hiển thị giờ mới.
- Icon lịch vẫn dùng để nghỉ/đổi riêng một ngày. Các ngoại lệ đã tạo có chủ đích vẫn độc lập với lịch lặp.

## Deadline
- Thêm mới điền ngày hiện tại theo giờ Việt Nam, gồm năm, ở cả trang Deadline và Thêm việc trên Hôm nay. Người dùng vẫn tự đổi ngày/năm.
- Không ghi đè năm người dùng chọn; đã lưu thử năm 2030 thành công.
- Mức Thấp có nhãn và nền thẻ xanh lá, hỗ trợ sáng/tối. Hai mức còn lại giữ nhãn hiện hành.
- Bộ đếm cạnh mức ưu tiên: Còn X ngày, Hôm nay, Quá hạn X ngày; nếu đã quá giờ ngay hôm nay thì Đã quá hạn. Không hiển thị bộ đếm cho việc đã hoàn thành.
- Đếm theo ngày Việt Nam, có cập nhật mỗi phút và khi quay lại tab, xử lý giao năm và giá trị ngày lỗi.
- Màn hình 320/390px cho nhãn/thao tác xuống hàng, không cuộn ngang toàn trang.

## Minh chứng và trạng thái nghiệm thu
- **260 backend / 33 bộ đạt**, PostgreSQL thử riêng 55456. [JSON](../qa/2026-10-27-review-backend.json).
- **73 frontend**, lint/build và **8 PWA/bản dựng đạt**.
- **6 nhóm trình duyệt mới đạt**, bản React dựng thật + API/Prisma/PostgreSQL thật và OCR thật trên ảnh người dùng. [JSON](../qa/2026-10-27-review-browser.json).
- Ảnh: [Danh mục đã ẩn](../qa/review-archived-starters.png), [bill nhận diện](../qa/review-receipt-real-photo.png), [deadline desktop](../qa/review-deadline-desktop.png), [deadline mobile tối](../qa/review-deadline-mobile-dark.png).
- [Kết quả OCR trước/sau](../qa/2026-10-27-receipt-recognition.json).
- Kịch bản/log ở improvement-backups/review-20261027. Tài khoản thử đã dọn; cụm PostgreSQL thử đã dừng và xóa riêng thư mục dữ liệu.
- **T21 và T22: người dùng CHƯA tự kiểm thử.** Có kiểm tra tự động hỗ trợ: bố cục nhỏ và đăng xuất/đổi tài khoản không lộ nháp/danh mục A sang B. Không đổi trạng thái nghiệm thu thủ công thành đạt.
- Chưa thử điện thoại vật lý, camera/cài PWA thật, email hoặc AI thật. Không triển khai Render trong đợt này.
