# Công việc tự thực hiện khi người dùng chưa rảnh kiểm thử — 28/10/2026

## Kết quả

Đã bổ sung công cụ sao lưu/khôi phục thử CSDL local và kiểm thử các tình huống lỗi của đặt lại mật khẩu/AI. Không thay đổi giao diện hoặc cấu trúc CSDL trong lượt này. Không cần người dùng thao tác để hoàn thành phần kiểm tra tự động.

## Sao lưu và khôi phục

- scripts/database-tools.cjs: backup, verify và restore-test.
- Sao_Luu_CSDL.cmd: mở nhanh để sao lưu CSDL local trong back/.env.
- Tự tìm công cụ PostgreSQL, không đưa mật khẩu/URL vào tham số tiến trình hoặc kết quả.
- Chỉ kết nối loopback. Sao lưu mặc định trong improvement-backups/database-backups, được Git bỏ qua.
- Khôi phục sang CSDL mới có hậu tố _restore_test; từ chối trùng nguồn/đích đã tồn tại. Không dùng DROP hoặc --clean.
- Kiểm tra SHA-256/kích thước trước khi tạo CSDL đích. Tệp hỏng bị chặn.
- CSDL đang dùng, back/.env và bản online không bị chuyển sang dữ liệu khôi phục.

Đã dùng PostgreSQL thử riêng tại cổng 55460, dữ liệu giả có đủ người dùng, môn/điểm, deadline, thu/chi, ngân sách, danh mục ẩn, lịch/điều chỉnh ngày, nhóm và tài liệu. Khôi phục từ pg_dump custom sang CSDL thử mới bằng pg_restore.

**17 nhóm kiểm tra đạt**: sao lưu/đọc archive; từ chối tệp hỏng; không khôi phục vào nguồn; không kết nối remote; khôi phục thành công; so sánh số hàng và mã băm nội dung từng bảng; nguồn giữ nguyên; chặn đích đã tồn tại; khóa ngoại và bộ đếm ID còn hoạt động; đăng nhập bằng mật khẩu hiện có; đọc môn/điểm; tài chính tách theo tài khoản; phạm vi chia sẻ giữ nguyên; danh sách RAG còn; lỗi kiểm tra tệp không tạo CSDL rác; metadata không chứa thông tin kết nối.

## Đặt lại mật khẩu và AI

Thêm 7 kiểm thử API đặt lại mật khẩu với dịch vụ email giả lập:

- Lưu hash thay cho token gốc, giới hạn thời gian và phản hồi chung cho email không tồn tại.
- Email gửi lỗi không làm thay đổi mật khẩu/phiên đăng nhập.
- Email cũ báo lỗi muộn không hủy link mới gửi thành công.
- Xin link mới làm link trước hết hiệu lực.
- Link sai/tài khoản khác/hết hạn không đổi được mật khẩu.
- Dùng link một lần, vô hiệu phiên cũ, đăng nhập được bằng mật khẩu mới.
- Mật khẩu/đầu vào sai không làm mất link hợp lệ.

Thêm 3 kiểm thử API cho hết hạn mức AI, quá thời gian và phản hồi hỏng: trả lỗi rõ ràng, không lặp yêu cầu, không lộ chi tiết dịch vụ; tra cứu dữ liệu local và phiên đăng nhập vẫn dùng được. Các kiểm thử đơn vị cho lỗi provider đã có được chạy lại cùng bộ.

**281 kiểm thử backend / 36 bộ đạt**, tăng 10 trường hợp so với 271/35 của lượt sửa trước. Kiểm tra cú pháp công cụ CSDL đạt. Không sửa frontend nên không chạy lại build/frontend đã đạt ở lượt trước.

## Phạm vi và giới hạn

- Email và AI được mô phỏng; không gửi email thật, không gọi Google/Gemini hoặc phát sinh phí.
- Không sao lưu/ghi vào CSDL thật 5432, không đổi mật khẩu người dùng thật; chỉ đọc mã/cấu hình cần thiết và dùng CSDL thử riêng.
- Chưa nghiệm thu email đến hộp thư thật, chất lượng/độ trễ AI thật, OCR/camera/PWA trên điện thoại vật lý. T21/T22 vẫn chờ người dùng kiểm.
- Công cụ chưa hỗ trợ sao lưu cloud, mã hóa archive hoặc tự chuyển web sang CSDL khôi phục.
- Chưa push GitHub hoặc deploy Render. Kết quả mới chỉ ở local.
- Sau kiểm tra đã dọn dữ liệu giả và dừng/xóa cụm PostgreSQL thử; giữ log/minh chứng và bản dump chứa dữ liệu giả trong thư mục Git bỏ qua.

## Tệp liên quan

- [Hướng dẫn sao lưu/khôi phục](../guides/DATABASE_BACKUP_RESTORE.md).
- [281 kiểm thử backend](../qa/2026-10-28-independent-backend.json).
- [17 kiểm tra sao lưu/khôi phục](../qa/2026-10-28-backup-restore.json).
- Kịch bản/log thử: improvement-backups/independent-checks-20261028.
