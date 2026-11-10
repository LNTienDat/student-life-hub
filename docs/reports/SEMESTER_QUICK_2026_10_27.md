# Thêm nhanh có ưu tiên và xóa học kỳ — 27/10/2026

Chỉ local; chưa commit/push/deploy. Hồ sơ chỉ được rà soát và đề xuất, chưa thêm trường hoặc thiết lập mới.

## Thêm việc trên Hôm nay
- Có Thấp, Bình thường, Khẩn cấp; mặc định Bình thường.
- Gửi đúng doUuTien cùng tiêu đề và hạn chót, thống nhất với trang Deadline.
- Giữ lựa chọn đang nhập khi chuyển mục/F5; lưu thành công xóa nháp tương ứng.
- Đã lưu một việc Khẩn cấp qua giao diện và xác minh lại trong CSDL/trang Deadline.

## Xóa học kỳ
- Nút Xóa học kỳ cạnh thiết lập kỳ hiện tại trên Hôm nay hoặc kỳ đang xem trong Học tập/TKB. Tất cả học kỳ không phải một đối tượng có thể xóa.
- GET /api/hoc-ky/kiem-tra-xoa?ten=... trả số môn, điểm, lịch lặp, ngoại lệ và deadline sẽ được giữ; chỉ đọc phạm vi tài khoản đang đăng nhập.
- Phải nhập lại tên kỳ và xác nhận phạm vi trước khi gửi DELETE /api/hoc-ky.
- Thực hiện trong một giao dịch: xóa môn/điểm và TKB/ngoại lệ của đúng kỳ; giữ tài chính và deadline. Deadline liên kết môn đã xóa sẽ được bỏ liên kết, không xóa công việc.
- Dữ liệu kỳ khác, lịch dùng chung không gắn kỳ và tài khoản khác được giữ.
- Nếu là kỳ đang học, bỏ chọn kỳ hiện tại; đồng bộ lựa chọn xem, hồ sơ, danh sách kỳ, cache và các tab.
- Kỳ chỉ có trong thiết lập hồ sơ, chưa có môn/lịch, vẫn xóa được.
- Chuẩn hóa tên HK1/hk1/khoảng trắng/dấu gạch như các màn hình khác.
- Dùng snapshot phạm vi kiểm tra ở máy chủ. Nếu số lượng hoặc tập dữ liệu thay đổi từ lúc xem trước, từ chối xóa; cập nhật lại số lượng và yêu cầu nhập tên xác nhận lần nữa.
- Đã thử hủy, sai tên, snapshot giả/cũ, thêm điểm sau xem trước, xóa thành công, F5 và tách tài khoản.
- Không cần migration mới; không xóa học kỳ hoặc dữ liệu thật của người dùng trong quá trình phát triển.

## Hồ sơ: đề xuất, chưa triển khai
1. Thông tin học tập tùy chọn: Trường, Ngành, Khóa học. Backend/CSDL đã có các trường này, nhưng giao diện hiện chỉ chỉnh tên/email/mật khẩu.
2. Thiết lập nhắc việc: chọn thời gian nhắc deadline, bật/tắt cảnh báo ngân sách.
3. Xuất dữ liệu cá nhân: lấy bản lưu môn/điểm, lịch, deadline và thu/chi.
Ưu tiên thông tin học tập trước; không thêm nhiều trường bắt buộc chỉ để làm đầy màn hình.

## Kiểm chứng
- 265 bài backend / 34 bộ đạt: [JSON](../qa/2026-10-27-semester-quick-backend.json).
- 73 bài frontend, lint/build và 8 PWA/bản dựng đạt.
- 6 nhóm trình duyệt đạt, React dựng thật + API/Prisma/PostgreSQL thử riêng: [JSON](../qa/2026-10-27-semester-quick-browser.json).
- [Thêm nhanh có ưu tiên](../qa/semester-quick-priority-desktop.png), [xác nhận xóa trên màn hình nhỏ](../qa/semester-delete-confirm-mobile.png).
- Kịch bản và log: improvement-backups/semester-quick-20261027. Cụm PG thử cổng 55457 đã dừng, chỉ bỏ thư mục dữ liệu thử; giữ kịch bản và minh chứng.
- Backend local đã chạy lại; /api/health và frontend qua 127.0.0.1:5173 hoạt động.
- Không gọi AI/email thật, không nghiệm thu thiết bị vật lý và không cập nhật trạng thái T21/T22 người dùng chưa tự kiểm thử.
