# Hoàn thiện quản lý danh mục và logic sử dụng — 26/10/2026

Chỉ áp dụng local. Chưa commit, push GitHub hoặc triển khai Render. Các kết quả bên dưới là kiểm thử trong môi trường riêng, không phải cam kết hết mọi lỗi.

## 1. Vì sao trước đó không thấy icon xóa?

Icon cũ chỉ xuất hiện khi chọn danh mục tự tạo. Ảnh người dùng đang chọn Ăn uống, một danh mục cơ bản, nên không có icon. Đã thay bằng nút **Quản lý** luôn hiện cạnh ô danh mục trong giao dịch, ngân sách và ghi chi nhanh.

Trong Quản lý:
- Danh mục tự tạo có bút đổi tên và thùng rác.
- Xóa chỉ bỏ khỏi lựa chọn mới, giữ mã, giao dịch, ngân sách và báo cáo lịch sử.
- Mục Đã bỏ khỏi danh sách có nút Khôi phục.
- Ăn uống, Đi lại, Khác được giữ làm mục cơ bản.
- + Thêm danh mục vẫn ở cuối danh sách lựa chọn.
- Chỉ thao tác trên danh mục của tài khoản đang đăng nhập.

## 2. Các phát hiện A1–A8 đã xử lý

| Mã từ báo cáo trước | Kết quả |
|---|---|
| A1 — tìm theo danh mục | Tìm theo tên hiển thị của đúng tài khoản, hỗ trợ không dấu, kể cả tên sau khi đổi. |
| A2 — giới hạn số tiền | Thêm/sửa giao dịch và ngân sách kiểm tra số nguyên từ 1 đến 1.000.000.000.000 đồng ở máy chủ và các biểu mẫu liên quan. Không nhận số lẻ hoặc số vượt giới hạn. |
| A3 — gỡ ngân sách | Có thùng rác ở từng hạn mức, xác nhận đúng tháng/danh mục, giữ toàn bộ giao dịch và số dư. |
| A4 — mất nội dung khi chuyển mục | Giữ nháp giao dịch, môn học/điểm, deadline, lịch nhập tay và thêm nhanh trong phiên tab. Tải lại/chuyển mục không tự tạo bản ghi. Lưu/hủy theo biểu mẫu và đăng xuất sẽ xử lý nháp tương ứng. |
| A5 — ngân sách ghi đè nháp | Giữ riêng nội dung ngân sách theo tháng và danh mục khi chuyển qua lại. |
| A6 — học kỳ lệch cách viết | Chuẩn hóa hoa/thường, khoảng trắng và dấu gạch khi ghi, lọc, tính GPA, nhập và kiểm tra trùng lịch. Dữ liệu cũ HK1/hk1 được đối chiếu chung khi đọc; không tự đổi hàng loạt tên trong CSDL. Không tự đoán HK1 và HKI là cùng kỳ. |
| A7 — chuông khác Hôm nay | Chuông hiển thị deadline chưa hoàn thành đã quá hạn hoặc đến hạn từ hôm nay đến hết ngày thứ ba tới, theo giờ Việt Nam. Tiêu đề Deadline: tên việc; ngày không có giờ. |
| A8 — biểu đồ gây tràn ngang | Giới hạn tooltip trong vùng biểu đồ. Đã tương tác rồi đổi kích thước 1440→320/390px, không còn cuộn ngang do tooltip. |

Nháp được lưu trong sessionStorage riêng cho tài khoản/tab, có thời hạn đọc lại tối đa 7 ngày và xóa khi đăng xuất. Đây không phải bản sao lưu lên máy chủ; không lưu mật khẩu, ảnh gốc hay tự đồng bộ nháp giữa thiết bị.

## 3. Hóa đơn có cảnh báo nhập trùng

- Sau OCR, tạo mã SHA-256 của ảnh ngay trên thiết bị; máy chủ nhận mã cùng các trường giao dịch, không nhận ảnh gốc.
- Trước khi thêm, cảnh báo nếu tài khoản đã có cùng ảnh; hoặc cùng mô tả có ý nghĩa, cùng ngày và số tiền.
- Chọn Quay lại kiểm tra giữ nội dung, chưa thêm khoản chi. Vẫn lưu giao dịch mới là xác nhận rõ ràng để ghi một khoản riêng.
- Khóa theo tài khoản khi kiểm tra/thêm để hai yêu cầu cùng lúc không vượt qua cảnh báo.
- Đây là gợi ý trùng, không phải nhận dạng chắc chắn mọi hóa đơn. Ảnh chụp lại có OCR khác mô tả/ngày/tiền vẫn có thể không phát hiện. Hai khoản hợp lệ giống nhau vẫn được phép sau xác nhận.
- OCR tiếp tục có bước sửa trước khi lưu; không khẳng định đọc đúng mọi ảnh.

## 4. Lịch riêng từng ngày

- TKB có chọn tuần, tuần trước/sau và Tuần này.
- Icon lịch cạnh bút/thùng rác mở Điều chỉnh một buổi học: Nghỉ buổi này hoặc Đổi ngày, giờ hoặc phòng.
- Thay đổi chỉ áp dụng cho ngày được chọn; không sửa lịch lặp hằng tuần.
- Điều chỉnh trong tuần hiển thị các ngoại lệ và có Hoàn tác.
- Kiểm tra trùng trên các buổi thực tế sau khi điều chỉnh, kể cả học bù sang tuần khác; giờ kết thúc bằng giờ bắt đầu buổi sau được chấp nhận.
- Chặn hoàn tác nếu khôi phục sẽ gây trùng; giữ dữ liệu điều chỉnh để người dùng giải quyết.
- Sửa lịch lặp vẫn mở thông tin gốc, không vô tình lấy giờ/phòng của một lần học bù. Khi đã có điều chỉnh, cần hoàn tác trước khi đổi thứ của lịch lặp.
- Xóa lịch đang xem xác nhận rõ sẽ xóa các lịch lặp thuộc phạm vi học kỳ đang xem ở mọi tuần và các điều chỉnh liên quan, bao gồm lịch có buổi nghỉ đang ẩn. Đây không phải nút nghỉ một tuần.
- Hôm nay và trang chia sẻ tải lịch thực tế theo tuần. Không tự đoán ngày kết thúc học kỳ.

## 5. CSDL local và kiểm thử

Đã áp dụng migration **20261026030000_dated_schedule_receipt** lên localhost:5432/student_life_hub: thêm trường mã ảnh hóa đơn và bảng DieuChinhLich có khóa ngoại/cascade. Đã tạo lại Prisma Client. Không chạy migration lên Neon, không ghi/xóa dữ liệu người dùng thật bằng các phép thử.

Kết quả:
- **257 kiểm thử máy chủ / 32 bộ đạt**, PostgreSQL thử riêng ở cổng 55455. [Kết quả JSON](../qa/2026-10-26-completion-backend.json).
- **71 kiểm thử frontend**, **8 kiểm tra PWA/bản dựng**, lint và build đạt.
- **14 nhóm trình duyệt đạt**, Chrome chạy bản dựng React thật, API/Prisma/PostgreSQL thật, OCR Tesseract thật. [Kịch bản và kết quả](../qa/2026-10-26-completion-browser.json).
- Các nhóm gồm đổi tên/xóa/khôi phục danh mục; nháp và F5; tìm không dấu; ngân sách theo danh mục; gỡ hạn mức; chuông; tooltip và màn hình nhỏ; hóa đơn trùng; nghỉ/đổi/hoàn tác theo ngày; giữ lịch gốc; xóa nhanh cả lịch có ngoại lệ; đăng xuất và tách tài khoản.
- Tài khoản/dữ liệu thử đã dọn. Cụm PostgreSQL thử được dừng và bỏ thư mục dữ liệu sau nghiệm thu; giữ mã kịch bản và nhật ký trong improvement-backups/completion-20261026.
- Backend local đã khởi động lại; frontend local tại http://127.0.0.1:5173.

Ảnh minh chứng: [Quản lý danh mục](../qa/completion-category-manager.png), [màn hình nhỏ](../qa/completion-manager-mobile.png), [cảnh báo hóa đơn trùng](../qa/completion-duplicate-receipt.png), [đổi lịch một ngày](../qa/completion-dated-schedule.png), [lịch trên màn hình nhỏ](../qa/completion-schedule-mobile.png).

## 6. Những giới hạn còn lại

- Chưa gọi AI/Gemini hoặc email thật, chưa đo tốc độ/chất lượng nhà cung cấp; không phát sinh phí AI trong đợt này.
- Chưa nghiệm thu camera/cài PWA/bàn phím bằng Android hoặc iOS vật lý; mô phỏng kích thước không thay thế máy thật.
- Chưa triển khai online. Bản Render hiện tại không tự có các sửa local này.
- TKB và Học tập vẫn có dữ liệu môn riêng; không tự đoán tín chỉ từ ảnh hoặc tự tạo điểm.
- GPA hiện thang 10 theo dữ liệu đã nhập, chưa tự quy đổi thang 4 theo quy định riêng của trường.
- OCR tên/phòng/giảng viên vẫn cần xem trước và đối chiếu ảnh; nháp trường đã đọc được giữ nhưng ảnh gốc không được khôi phục sau F5.
