# Sao lưu và khôi phục thử CSDL local

Công cụ này dùng PostgreSQL trên máy. Chưa hỗ trợ sao lưu Neon/Render và không đổi CSDL mà web đang sử dụng.

## Sao lưu

Cách nhanh: mở **Sao_Luu_CSDL.cmd** ở thư mục dự án.

Hoặc mở terminal tại thư mục dự án, chạy:

```powershell
node scripts/database-tools.cjs backup
```

Công cụ đọc DATABASE_URL từ back/.env, chỉ chấp nhận địa chỉ loopback của máy và kiểm tra có bảng LifeHub. Cần PostgreSQL đang chạy và đã cài thư viện backend. Công cụ tự tìm pg_dump, pg_restore, psql và createdb trong PATH hoặc thư mục PostgreSQL trên Windows. Nếu cài ở nơi khác, đặt PG_BIN_DIR tới thư mục bin.

Kết quả nằm trong **improvement-backups/database-backups/**:

- lifehub-...dump: cấu trúc, dữ liệu, quan hệ, chỉ mục và bộ đếm ID của CSDL.
- lifehub-...dump.json: kích thước, ngày tạo, phiên bản công cụ và mã kiểm tra SHA-256.

Giữ cả hai tệp. Các bản sao lưu nằm trong thư mục được Git bỏ qua. Nên chép sang một nơi lưu trữ riêng của bạn trước khi cài lại máy hoặc chuyển máy; bản sao nằm trên cùng ổ đĩa không bảo vệ được khi ổ đĩa hỏng.

Bản sao có thông tin tài khoản, mật khẩu đã băm, dữ liệu học tập/tài chính và tài liệu cá nhân. Không đưa lên Git, gửi công khai hoặc chụp nội dung. Đây chưa phải tệp được mã hóa. Mã SHA-256 dùng phát hiện tệp thay đổi/hỏng, không chứng minh người gửi đáng tin.

Sao lưu này không bao gồm mã nguồn, back/.env, khóa API, cấu hình Render hoặc các tệp bên ngoài CSDL. Xuất Excel/PDF là báo cáo dữ liệu, không thay thế sao lưu CSDL.

## Kiểm tra tệp

Thay đường dẫn bằng bản sao lưu vừa tạo:

```powershell
node scripts/database-tools.cjs verify --file "D:\EDU\Do_An_2_SLH\improvement-backups\database-backups\lifehub-....dump"
```

Kết quả hợp lệ chỉ xác nhận tệp khớp mã kiểm tra. Muốn biết dữ liệu dùng lại được hay không, cần khôi phục thử.

## Khôi phục sang CSDL thử mới

Chỉ khôi phục tệp do bạn tạo và tin cậy. Chọn tên CSDL mới, kết thúc bằng _restore_test:

```powershell
node scripts/database-tools.cjs restore-test --file "D:\EDU\Do_An_2_SLH\improvement-backups\database-backups\lifehub-....dump" --database lifehub_check_restore_test
```

Công cụ kết nối máy PostgreSQL local trong back/.env rồi tạo CSDL thử riêng bằng tài khoản đó. Tài khoản cần quyền tạo CSDL. Nếu CSDL đích đã tồn tại hoặc trùng nguồn, thao tác sẽ bị từ chối. Không có tùy chọn ghi đè/xóa CSDL. Nếu khôi phục lỗi, nguồn giữ nguyên; CSDL thử được giữ lại để kiểm tra.

Sau khi khôi phục:

1. Mở pgAdmin, Refresh mục Databases rồi chọn CSDL thử mới.
2. So sánh người dùng, môn học/điểm, deadline, thu/chi, ngân sách, danh mục, TKB/điều chỉnh ngày và tài liệu.
3. Chỉ chuyển cấu hình web sang CSDL khôi phục sau khi kiểm tra xong. Công cụ không tự sửa back/.env hoặc chuyển web sang CSDL thử.
4. Khi không cần CSDL thử nữa, xác nhận đúng tên trước khi tự xóa trong pgAdmin.

Có thể dùng --env với tệp cấu hình local riêng cho kiểm thử. Không truyền mật khẩu hoặc URL CSDL trên dòng lệnh và không gửi chúng vào chat.

## Khi nào nên sao lưu

Trước khi đổi cấu trúc CSDL, dọn dữ liệu hàng loạt, chuyển máy và trước buổi demo/nghiệm thu. Nên giữ một bản đã khôi phục thử thành công.

Đã xác minh ngày 28/10/2026 trên CSDL giả riêng: 17 kiểm tra đạt, nội dung 15 bảng khớp sau khôi phục, đăng nhập và API hoạt động. Chưa tạo bản sao của dữ liệu thật hoặc thử khôi phục Neon.
