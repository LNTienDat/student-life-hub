# Danh mục cuối danh sách, tách ghi chú OCR và xóa lịch nhanh — 26/10/2026

Chỉ local, chưa commit/push/deploy. Không sửa hoặc xóa lịch thực của người dùng trong quá trình kiểm thử.

## Thay đổi

- Thay nút + bên cạnh danh mục bằng dòng **+ Thêm danh mục** ở cuối danh sách. Áp dụng đồng bộ cho giao dịch, ngân sách và Ghi khoản chi nhanh. Chọn dòng này mở biểu mẫu thêm; hủy giữ lựa chọn cũ; lưu chọn ngay danh mục mới mà không gửi biểu mẫu giao dịch bên ngoài.
- Quét thời khóa biểu: dùng thêm thông tin màu của chữ trong dòng ghi chú và vị trí so với tiêu đề, bỏ ghi chú khỏi tên môn ngay cả khi OCR đọc sai nhãn Ghi chú. Vẫn giữ tiêu đề nhiều dòng và lịch tạm ngưng được bỏ chọn.
- Khi dòng phòng bị bỏ sót, đọc cột thêm một lượt ở độ phóng lớn hơn với cách tách dòng khác. Chỉ bổ sung các trường có bằng chứng cấu trúc, không ghi đè kết quả giờ đã kiểm tra.
- Nút **Xóa lịch đang xem** xóa một lượt các buổi hiển thị. Hộp xác nhận ghi rõ học kỳ hoặc Tất cả học kỳ đang xem, số buổi, và nhắc lịch cũ chưa xếp kỳ nếu có. Hủy không xóa dữ liệu.
- POST /api/thoi-khoa-bieu/xoa-nhieu nhận danh sách ID đã xem trước, kiểm tra đúng chủ sở hữu, số nguyên dương, không trùng, tối đa 1.000 ID. Giao dịch CSDL thực hiện nguyên khối: nếu một ID thiếu hoặc thuộc tài khoản khác thì không xóa buổi nào. Buổi được thêm sau khi mở xác nhận không nằm trong danh sách xóa.
- Sau xóa làm mới bảng lịch, dữ liệu Hôm nay/khác tab qua cơ chế revision hiện có và đặt lại phần nhập ảnh để tránh đối chiếu với danh sách cũ. Không thay đổi học kỳ đang học.

## Kiểm thử

- 235 kiểm thử backend/30 bộ đạt trên PostgreSQL thử riêng, gồm 13 trường hợp mới về xóa nhiều buổi, phân quyền, danh sách cũ và tính nguyên khối. docs/qa/2026-10-26-timetable-cleanup-backend.json.
- 66 kiểm thử frontend đạt, gồm ghi chú bị OCR thành chữ rác, ghi chú không có khoảng cách và tiêu đề màu xuống dòng. Lint, build và 8 kiểm thử PWA/bản dựng đạt.
- 10 nhóm Chrome với bản dựng thật, API/Prisma và PostgreSQL thử riêng đạt: thêm danh mục/hủy/thu/chi/thêm nhanh; OCR ảnh thật, sửa và lưu; xác nhận/hủy xóa, phạm vi học kỳ, tài khoản khác, buổi mới phát sinh, danh sách thay đổi và giao diện tối 320/390px. docs/qa/2026-10-26-timetable-cleanup-browser.json.
- OCR thật trên cả ba ảnh TKB đã cung cấp: docs/qa/2026-10-26-timetable-cleanup-ocr.json. Ảnh Screenshot 2026-10-26 144549.png nhận đủ 6 tên môn và các khoảng giờ đúng; tên Kỹ năng nghề nghiệp không còn ghép ghi chú. Ảnh cũ có lớp tạm ngưng vẫn bỏ chọn đúng. Ảnh có đường đỏ che chữ còn một giờ chưa chắc nên để trống.
- Ảnh giao diện: timetable-note-cleaned-desktop.png, timetable-bulk-delete-mobile.png, category-add-option-mobile.png trong docs/qa.

## Giới hạn và cách dùng

F5 bản local. Danh mục → + Thêm danh mục ở cuối. TKB → chọn học kỳ đang xem → Xóa lịch đang xem → kiểm tra phạm vi/số buổi → xác nhận nếu muốn xóa. Nếu đang chọn Tất cả học kỳ thì hộp xác nhận sẽ nói rõ xóa lịch của tất cả kỳ đang hiển thị.

Lịch đã lưu từ lượt OCR cũ không được tự sửa. Có thể sửa từng buổi; nếu muốn nhập lại, dùng xóa nhanh đúng phạm vi rồi quét lại ảnh.

OCR chưa bảo đảm đúng toàn bộ chữ: các dấu trong tên giảng viên, Phòng máy và ký tự I/l/1 trong mã phòng vẫn có thể nhầm. Trong phép thử lưu, phòng l4-03 đã được người thử sửa thành I4-03 trước khi xác nhận. Không tuyên bố rằng tên giảng viên hoặc mã phòng đã chính xác hoàn toàn. Bản xem trước vẫn cho sửa các trường này và chỉ lưu khi xác nhận. Không gửi ảnh lên dịch vụ AI ngoài; chưa thử camera điện thoại vật lý.
