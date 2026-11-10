# Học kỳ hiện tại và biểu tượng cài ứng dụng — 26/10/2026

## Phạm vi
Chỉ local; chưa commit/push/deploy. Đã áp dụng migration chỉ thêm cột vào database local student_life_hub, không sửa/xóa bản ghi môn học, điểm, lịch hoặc thu chi.

## Cách dùng
1. Trên Hôm nay, bấm Chọn học kỳ đang học; nhập tên có năm học (ví dụ HK1 2026–2027) và Áp dụng.
2. Tên học kỳ được lưu theo tài khoản, dùng để tự điền môn học, lịch học, thêm lịch nhanh và bản xem trước quét ảnh. Mẫu CSV môn học cũng dùng kỳ đang xem/đang học.
3. Không cần nhập ngày kết thúc. Khi nhận lịch kỳ mới, bấm Đổi học kỳ để chuyển. Không tự suy đoán thời điểm hết kỳ.
4. Trên Học tập/TKB, Xem dữ liệu cho phép xem kỳ cũ hoặc tất cả, không đổi thiết lập học kỳ đang học. Thêm dữ liệu khi chủ động xem một kỳ cụ thể sẽ dùng kỳ đó; khi xem tất cả sẽ dùng kỳ hiện tại.
5. Hôm nay chỉ lấy lịch học của kỳ hiện tại (và lịch chưa xếp kỳ dùng chung theo quy tắc API cũ). Điểm GPA tích lũy, deadline cá nhân và tài chính theo tháng vẫn giữ phạm vi phù hợp của chúng.
6. Biểu tượng tải xuống ở thanh điều hướng luôn mở được cài đặt/hướng dẫn khi chưa cài. Thay thanh mời cài có nút X bằng icon; khóa dismiss cũ không làm mất icon. Trang chưa đăng nhập cũng có icon.
7. Nếu trình duyệt có prompt cài, dùng prompt thật; nếu chưa có hoặc người dùng từ chối thì vẫn mở lại hướng dẫn được. Cài thành công/standalone sẽ ẩn icon theo trạng thái PWA.

## Kỹ thuật
- NguoiDung.hocKyHienTai: String mặc định rỗng. Cập nhật qua PUT /auth/ho-so, chỉ tài khoản đang xác thực; kiểm tra kiểu, nội dung không rỗng, tối đa 100 ký tự.
- Migration: 20261026000000_current_semester. Đã generate Prisma Client và migrate deploy local.
- Cần triển khai backend/migration cùng thay đổi frontend khi phát hành online. Chưa thực hiện phát hành.
- Context học kỳ tải lại hồ sơ khi khôi phục phiên, giữ riêng bộ lọc xem dữ liệu, cách ly tài khoản. Không tự gán lại dữ liệu lịch cũ chưa có học kỳ.
- Icon dùng chung trạng thái PWA hiện có; hướng dẫn là dialog có quản lý bàn phím/vị trí focus.
- Trên màn hình dưới 360px chỉ hiện logo sách để đủ chỗ cho các nút 44px.

## Kiểm thử và minh chứng
- 209 bài backend / 28 bộ đạt; thêm 9 ca lưu/đăng nhập lại/kiểm tra sai kiểu và độ dài/cách ly tài khoản/giữ dữ liệu kỳ cũ.
- 59 bài frontend và 8 PWA/bản dựng đạt; lint/build đạt.
- 13 nhóm trình duyệt trên production bundle + Express/Prisma/PostgreSQL thật, database thử riêng ở cổng 55451: thiết lập kỳ không có ngày kết thúc, tự điền các form và OCR thật, đổi kỳ, xem lại lịch sử, lưu thêm nhanh, khôi phục trên browser context mới, đổi tài khoản, mở lại hướng dẫn và trạng thái đã cài; kiểm tra 320/390px và giao diện tối. Không có lỗi JavaScript.
- Prompt cài và appinstalled được phát sự kiện mô phỏng trong browser test; chưa cài thật hay thử điện thoại vật lý.
- Tài khoản thử đã xóa; cụm PostgreSQL thử đã dừng và thư mục dữ liệu thử đã dọn. PostgreSQL local thật 5432 và website local vẫn chạy.

[Backend](../qa/2026-10-26-semester-backend.json)
[Trình duyệt](../qa/2026-10-26-semester-install-browser.json)
[Desktop](../qa/semester-current-desktop.png)
[Mobile](../qa/semester-current-mobile.png)
[Hướng dẫn cài mobile](../qa/install-icon-help-mobile.png)
