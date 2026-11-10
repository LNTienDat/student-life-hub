# Báo cáo sửa 5 phát hiện rà soát — 28/10/2026

Đã xử lý A1–A5 trong [báo cáo rà soát](FULL_AUDIT_2026_10_28.md). Chỉ local; chưa commit/push/deploy, không đổi GitHub hoặc Render.

## Thay đổi và kết quả

| Mã | Trước sửa | Sau sửa |
|---|---|---|
| A4 | Chatbot đọc lịch lặp, vẫn báo buổi đã nghỉ | Dùng cùng phép tính lịch theo tuần/ngày như TKB, áp dụng nghỉ/đổi riêng ngày; lấy học kỳ đang học và lịch dùng chung |
| A2 | Đổi loại thu/chi nhưng giữ mã danh mục không phù hợp ngầm | Xóa bộ lọc danh mục không còn thuộc loại mới; giữ danh mục nếu còn hợp lệ |
| A3 | Bấm ngân sách danh mục đã ẩn lại tự chọn Ăn uống | Ngân sách cũ giữ nguyên, có lời giải thích và chặn ghi nhanh cho đến khi khôi phục; không tự gán sang mục khác |
| A1 | Link công khai gộp mọi học kỳ | Chọn học kỳ trước khi bật; phạm vi lưu riêng cho liên kết, đổi kỳ đang học không đổi phạm vi link đã phát hành |
| A5 | RAG hướng dẫn chưa hỗ trợ ngoại lệ ngày | Cập nhật hướng dẫn đúng tính năng nghỉ/đổi ngày, chia sẻ và danh mục; phiên bản nguồn 28/10/2026 |

### Chatbot và RAG

- Lịch hôm nay/ngày mai dùng loadWeek/projectWeek và dữ liệu điều chỉnh theo ngày.
- Xử lý cả chuyển Chủ nhật sang Thứ hai, chuyển buổi học sang tuần khác, thay phòng/giờ và buổi nghỉ.
- Học kỳ hiện tại được lấy từ tài khoản. Nếu chưa chọn kỳ, trợ lý nói rõ đang xem tất cả học kỳ, giống phạm vi mặc định của lịch Hôm nay.
- Nội dung tóm tắt vẫn không gửi ID, email hoặc mật khẩu vào AI.
- Hướng dẫn mặc định giữ nguyên thứ tự 9 trang cũ để các trích dẫn hiện có không bị đổi số; thêm phần chia sẻ và danh mục ở cuối.
- Đã kiểm tra chế độ tìm/đọc tài liệu, không gọi AI thật.

### Tài chính

- Ví dụ Ăn uống → Thu nhập: ô danh mục và truy vấn đều trở về Tất cả danh mục, hiển thị đúng khoản thu.
- Các mục có cùng mã hợp lệ cho cả thu/chi như Khác vẫn được giữ.
- Danh mục đã ẩn vẫn lọc/xem/sửa được lịch sử đúng tên.
- Ngân sách của danh mục đã ẩn giữ hạn mức và giao dịch, chỉ chặn thao tác tạo khoản chi mới từ ngân sách đó.
- Khôi phục danh mục trong Quản lý rồi bấm ngân sách: form dùng lại đúng mã cũ; đã lưu thử khoản chi 15 000đ đúng mục Mua sách.
- Nếu xóa danh mục đang chọn trong form tạo giao dịch, lựa chọn được để trống và bắt chọn rõ ràng. Khi sửa giao dịch cũ, danh mục đã ẩn vẫn được giữ.

### Chia sẻ TKB

- Hộp chia sẻ có ô Học kỳ chia sẻ, trạng thái phạm vi đang được chia sẻ và liên kết chỉ xem.
- Mặc định gợi ý kỳ đang xem/kỳ đang học; người dùng có thể chọn kỳ khác đã có hoặc chỉ lịch dùng chung.
- Chọn học kỳ thì bao gồm lịch dùng chung chưa gắn kỳ. Chọn chỉ lịch dùng chung không hiển thị môn của học kỳ khác.
- Phạm vi cố định theo liên kết đã phát hành. Query của khách không thể mở rộng sang kỳ khác.
- Đổi phạm vi tạo token mới và chặn link trước. Tắt chia sẻ chặn link hiện có.
- Link cũ chưa có phạm vi không tiếp tục hiển thị tất cả học kỳ: vào Chia sẻ TKB, chọn kỳ rồi bật lại để tạo link mới.
- Khi máy chủ chưa cập nhật hỗ trợ phạm vi, giao diện mới chặn bật chia sẻ và báo cần cập nhật máy chủ, tránh phát hành link có phạm vi sai.
- Kiểm tra hộp chọn ở 320/390px và chế độ tối.

## CSDL local

- Thêm migration 20261028000000_scoped_timetable_sharing: cột NguoiDung.shareHocKy dạng nullable.
- Đã áp dụng vào đúng localhost:5432/student_life_hub và tạo lại Prisma Client.
- Đối chiếu số lượng người dùng, môn, điểm, deadline, giao dịch, ngân sách, lịch, điều chỉnh và tài liệu trước/sau migration: không thay đổi.
- Không chạy migration trên Neon. Không sửa/xóa dữ liệu học tập hoặc thu/chi thật.
- API local đã khởi động lại để nạp mã mới; http://127.0.0.1:5000/api/health trả ok và giao diện 5173 trả HTTP 200.

## Kiểm thử

- **271 kiểm thử backend / 35 bộ đạt**, gồm 6 trường hợp hồi quy mới cho chatbot theo ngày, phạm vi chia sẻ, liên kết cũ, đầu vào sai và nội dung hướng dẫn.
- **74 kiểm thử frontend đạt**, có hồi quy bộ lọc danh mục theo loại thu/chi.
- **8 kiểm thử PWA/bản dựng đạt**; lint và build bản cuối đạt. Tổng **353 bài tự động đạt**.
- **23 nhóm trình duyệt/API/CSDL thử bổ sung đạt**: 19 nhóm chính và 4 nhóm danh mục/khả năng tương thích.
- Chrome chạy UI thật, API thật trên 5059, PostgreSQL thử riêng 55459; chỉ có tài khoản giả. Không có lỗi JavaScript trang trong các lượt thành công.
- Đã xem ảnh minh chứng hộp chia sẻ và ngân sách; bảy trang không tràn ngang toàn trang ở 1440/390/320px với dữ liệu thử.
- Các tiến trình UI/API thử đã dừng. Tài khoản giả còn lại bằng 0; CSDL thử đã dừng và xóa sau kiểm tra đường dẫn.
- Một bài hồi quy cũ dùng mặc định chia sẻ tất cả kỳ được đổi sang chọn rõ HK1 theo quy tắc mới; vẫn giữ kiểm tra điều chỉnh ngày, quyền tài khoản và dữ liệu công khai.
- Chưa nghiệm thu AI/email thật, camera/PWA trên điện thoại vật lý hoặc bản online. T21/T22 chưa được người dùng tự xác nhận.

## Minh chứng và cách thử lại

- [Backend](../qa/2026-10-28-audit-fixes-backend.json).
- [19 nhóm chính](../qa/2026-10-28-audit-fixes-browser.json), [4 nhóm bổ sung](../qa/2026-10-28-audit-fixes-supplement.json).
- [Bộ lọc thu nhập](../qa/audit-fixes-income-filter-fixed.png).
- [Ngân sách danh mục đã ẩn](../qa/audit-fixes-archived-budget-disabled.png).
- [Chia sẻ mobile](../qa/audit-fixes-sharing-scope-mobile.png), [chế độ tối](../qa/audit-fixes-sharing-dark-mobile.png).
- Kịch bản, log và đối chiếu migration: improvement-backups/audit-fixes-20261028.

Mở web local và F5. Thử lần lượt: đổi loại bộ lọc, khôi phục danh mục và ghi chi từ ngân sách, báo nghỉ rồi hỏi trợ lý, chia sẻ một học kỳ và đổi phạm vi. Các link chia sẻ cũ cần bật lại một lần.

Khi triển khai sau này, cần đưa đầy đủ module/migration mới lên Git và cập nhật backend cùng CSDL trước frontend. Lượt này chưa đẩy mã hoặc triển khai online.
