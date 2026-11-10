# Xóa danh mục và rà soát logic — 26/10/2026

> Update: [COMPLETION_2026_10_26.md](COMPLETION_2026_10_26.md) resolves A1-A8 and adds category management, receipt duplicate warnings and dated timetable changes. The findings below describe the earlier audit.

Chỉ local, chưa commit/push/deploy. Đã làm xóa danh mục; các phát hiện ở phần B/C chưa được sửa, để người dùng xem và sắp xếp thứ tự.

## A. Đã thực hiện

- Chọn danh mục tự thêm → icon thùng rác → xác nhận. Ba mục Ăn uống, Đi lại, Khác được giữ.
- Bỏ danh mục khỏi lựa chọn mới, giữ tên giao dịch/ngân sách/báo cáo cũ. Không xóa tiền hoặc chuyển dữ liệu sang Khác. Biểu mẫu tạo mới đang chọn mục vừa xóa chuyển sang Khác; sửa giao dịch cũ vẫn giữ mã/tên cũ.
- Thêm lại cùng tên đã chuẩn hóa khôi phục đúng mã cũ. Có xử lý hủy/lỗi, phân quyền, đồng bộ tab khác và chống kết quả tải cũ ghi đè.
- Tích hợp trong giao dịch, ngân sách và ghi chi nhanh. Danh mục đã xóa vẫn có trong bộ lọc lịch sử với nhãn rõ ràng.
- Thêm cột daAn bằng migration 20261026020000_archive_finance_category. Đã xác minh đích localhost:5432/student_life_hub, chỉ áp dụng local; không xóa dữ liệu thực.
- Điều chỉnh độ co giãn bộ lọc khi tên danh mục dài.

Kiểm thử: 240 backend/31 bộ, 66 frontend, lint/build, 8 PWA/bản dựng và 7 nhóm trình duyệt đạt. CSDL/tài khoản thử riêng; không ghi/xóa dữ liệu người dùng thật. Minh chứng: docs/qa/2026-10-26-category-archive-backend.json, docs/qa/2026-10-26-category-archive-browser.json và ảnh category-delete-confirm-mobile.png.

## B. Đã tái hiện, chưa sửa

| Mã | Mức | Phát hiện | Đề nghị |
|---|---|---|---|
| A4 | Cao | Nhập giao dịch dở, chuyển sang Hôm nay rồi trở lại: mất biểu mẫu, không hỏi xác nhận. Cảnh báo đổi tháng/hủy hiện có không bảo vệ đổi mục. | Giữ nháp hoặc chặn điều hướng khi có thay đổi. |
| A5 | Cao | Ngân sách Mua sách 10.000đ, sửa thành 15.000đ, đổi danh mục rồi quay lại: trở về 10.000đ mà không hỏi. | Giữ nháp theo danh mục hoặc hỏi trước khi bỏ. |
| A2 | Cao về dữ liệu | API giao dịch nhận 0,5đ và 9.007.199.254.740.992đ, cả hai HTTP 201. Giao diện giao dịch đã có kiểm tra số nguyên an toàn nhưng máy chủ chưa đồng bộ. Ngân sách máy chủ cũng chỉ kiểm tra hữu hạn/dương (đọc mã). | Chặn số lẻ/quá lớn tại máy chủ cho thêm/sửa giao dịch/ngân sách và luồng nhập. |
| A6 | Cao | Hai buổi cùng giờ cho HK1 và hk1 đều HTTP 201; xem HK1 chỉ thấy một. | Chuẩn hóa/mã hóa học kỳ dùng chung; cần kế hoạch gộp dữ liệu cũ, không tự sửa nhãn hàng loạt. |
| A1 | Vừa | Giao dịch Mua sách có mô tả khác: tìm từ Mua sách ra 0, lọc theo danh mục ra 1. | Tìm theo tên hiển thị của đúng tài khoản, thay vì chỉ mô tả/mã. |
| A3 | Vừa, thiếu chức năng | Không có nút xóa/bỏ ngân sách; DELETE /api/finance/ngan-sach trả 404. | Thêm thao tác gỡ hạn mức theo tháng/danh mục. Xóa danh mục hiện giữ ngân sách và cảnh báo cũ. |
| A8 | Vừa | Sau tương tác rồi đổi từ 1440px xuống 320/390px, tooltip biểu đồ giữ vị trí cũ. Tại 390px đo chiều rộng cuộn 442px, mép tooltip 442,2px. | Giới hạn/đặt lại tooltip khi resize để tránh tràn ngang. Ô chọn, icon xóa và hộp xác nhận vẫn nằm trong viewport. |
| A7 | Cần thống nhất | Chuông chỉ nhắc trong 24 giờ, không có việc quá hạn hoặc sau 48 giờ; Hôm nay cảnh báo đến 3 ngày và cả quá hạn. | Chốt một quy tắc hoặc giải thích rõ khác nhau. Đây là khác biệt quy tắc hiện tại, không phải API không chạy. |

Minh chứng thực thi nằm trong trường audit của JSON trình duyệt; A2 có hai phép thử, tổng chín quan sát. Không sửa các điểm này trong đợt thêm icon.

## C. Còn thiếu/giới hạn từ mã và phép thử trước

Các mục này cần cân nhắc theo phạm vi đồ án; không phải tất cả đều bắt buộc:

1. Danh mục chưa có đổi tên: hiện thêm, bỏ khỏi lựa chọn và khôi phục.
2. Quét hóa đơn chưa có cảnh báo tải lại cùng hóa đơn. Chống bấm Lưu hai lần không thay thế phát hiện bill nhập trước đó; nếu bổ sung nên cảnh báo thay vì cấm, vì hai khoản cùng tiền/ngày có thể hợp lệ.
3. TKB lặp hàng tuần theo học kỳ, chưa có ngoại lệ theo tuần/ngày, tuần nghỉ, đổi phòng một ngày hoặc lịch thi riêng. Đổi học kỳ vẫn do người dùng chọn khi có lịch mới, không tự đoán kết thúc.
4. OCR vẫn có thể sai dấu tên giảng viên, Phòng máy hoặc I/l/1 trong mã phòng. Ba ảnh đã thử đủ 6 môn; ảnh cũ có đường đỏ che giờ còn một khoảng để trống. Ảnh mới đã tách đúng ghi chú/tên Kỹ năng nghề nghiệp và đọc đúng các khoảng giờ. Phải giữ bước xem trước.
5. Học tập và TKB dùng chung lựa chọn học kỳ nhưng lưu môn riêng. Quét TKB không tự tạo môn có tín chỉ/điểm; muốn liên kết cần tránh môn trùng, không tự đoán tín chỉ.
6. GPA là thang 10 theo tín chỉ, điểm thiếu trọng số là tạm tính; chưa tự quy đổi thang 4/điểm chính thức theo quy định riêng của trường.

## D. Chưa kiểm chứng trên môi trường thật

- AI/Gemini: chưa gọi nhà cung cấp thật hoặc đo chất lượng/tốc độ vì chưa xác nhận khóa miễn phí và Billing. RAG nhận PDF có chữ/TXT/MD; chưa OCR PDF scan trong kho tài liệu.
- Email khôi phục/nhắc việc: chưa xác nhận gửi tới hộp thư bằng cấu hình triển khai hiện tại; không gửi email thật trong đợt này.
- Camera, cài PWA, bàn phím trên điện thoại vật lý Android/iOS: kích thước trình duyệt mô phỏng không thay thế thử máy thật.
- Bản mới chưa triển khai online; cần triển khai backend/migration/frontend rồi thử bằng tài khoản online riêng. CSDL local và online là hai môi trường khác nhau.

## Thứ tự đề nghị

1. Bảo vệ dữ liệu nhập dở, kiểm tra số tiền máy chủ, định danh học kỳ thống nhất.
2. Tìm theo tên danh mục, gỡ ngân sách và sửa tooltip.
3. Thống nhất thông báo, cân nhắc đổi tên danh mục/chống bill trùng/lịch có ngoại lệ.
4. Nghiệm thu AI/email/thiết bị và bản online.

Phạm vi: rà mã tài khoản/hồ sơ, học kỳ, học tập, deadline, TKB, tài chính, thông báo và cài PWA; chạy bộ kiểm thử hiện có, tái hiện có mục tiêu các trường hợp bên trên. Không khẳng định toàn bộ hệ thống đã hết lỗi.
