# Kiểm tra sử dụng trên điện thoại trước khi chốt tên đề tài

Ngày ghi nhận: 21/10/2026. Đối tượng: bản online tại https://student-life-hub-inx4.onrender.com.

## Kết quả đã quan sát

- Kiểm tra bằng trình duyệt trên máy tính với khung hiển thị 390 × 844 và 360 × 800; đây không phải máy Android thật hay trình giả lập Android.
- Trang Hôm nay mở được ở cả hai khung; không thấy tràn ngang toàn trang tại thời điểm kiểm tra.
- Menu điện thoại mở được và chuyển đến Học tập, Deadline, Thời khóa biểu, Tài chính.
- Mở được biểu mẫu thêm môn học, deadline, buổi học và giao dịch. Biểu mẫu giao dịch vừa khung 360 px; biểu mẫu lịch học không tràn ngang ở 390 px.
- Hướng dẫn cài PWA có nội dung Android và iPhone; mã nguồn có manifest với display standalone và viewport dành cho thiết bị di động.
- Không lưu thử dữ liệu vào tài khoản online, không sửa dữ liệu đang có. Chưa kiểm tra nhập và lưu trên điện thoại thật, bàn phím cảm ứng, bộ chọn ngày giờ Android, cài PWA thật, thông báo hay tải tệp trên Android.
- Khi mở lần đầu, Render có hiển thị màn hình khởi động dịch vụ; sau đó website tải được. Đóng gói Android không tự loại bỏ thời gian chờ máy chủ.

Minh chứng giao diện 360 px: `improvement-backups/mobile-check-20261021/dashboard-360.png` (ảnh kiểm tra, được Git bỏ qua).

## Bài thử trên điện thoại Android thật

Dùng Chrome ở chế độ bình thường, bật mạng và mở địa chỉ online ở trên. Không dùng localhost/127.0.0.1 trên điện thoại. Không cần bật VS Code hoặc máy tính để truy cập bản online.

Nên tạo tài khoản thử riêng và chỉ dùng dữ liệu giả có tiền tố TEST. Không thử xóa hoặc sửa dữ liệu thật.

Ghi lại mẫu điện thoại, phiên bản Android, phiên bản Chrome và ngày kiểm tra. Mỗi mục chỉ đánh dấu đạt sau khi quan sát kết quả.

| Mục | Cách thử và tiêu chí đạt | Kết quả trên máy thật |
|---|---|---|
| Đăng nhập | Đăng nhập tài khoản thử; mở lại trang vẫn đúng tài khoản | Chưa thử |
| Điều hướng | Mở menu và lần lượt vào các mục; chữ, nút không bị cắt | Chưa thử |
| Học tập | Tạo TEST Môn học 3 tín chỉ; nhập điểm 8 với trọng số 100%; tải lại vẫn còn và tính đúng | Chưa thử |
| Deadline | Tạo TEST Công việc với ngày giờ tương lai; sửa rồi đánh dấu hoàn thành; tải lại đúng trạng thái | Chưa thử |
| Lịch học | Tạo TEST Lịch học với ngày, giờ, phòng; xem được và sửa được trên màn hình nhỏ | Chưa thử |
| Tài chính | Ghi TEST Thu 100.000 đồng và TEST Chi 20.000 đồng; tài khoản trống có số dư 80.000 đồng; tải lại đúng | Chưa thử |
| Bàn phím | Chạm các ô tên, tiền, ngày giờ; bàn phím không che nút lưu không thể cuộn tới; nhập tiếng Việt được | Chưa thử |
| Cài PWA | Chrome → menu ⋮ → Thêm vào màn hình chính/Cài đặt ứng dụng → Cài đặt (tên mục có thể khác theo phiên bản); mở biểu tượng LifeHub và dùng lại các mục chính | Chưa thử |
| Đồng bộ | Mở cùng tài khoản trên máy tính; các bản ghi TEST xuất hiện sau khi tải lại | Chưa thử |
| Mạng | Tắt mạng thấy thông báo phù hợp; bật lại và thử kết nối lại; dữ liệu đã lưu không biến mất | Chưa thử |

Lưu ảnh hoặc quay màn hình các thao tác chính để làm minh chứng. Với lỗi: ghi màn hình nào, thao tác nào, kết quả mong đợi và kết quả thực tế. Nhập/xuất Excel/PDF và thông báo cần bài kiểm tra riêng nếu đưa vào phạm vi demo điện thoại.

## Cách chốt tên đề tài

- Phạm vi hiện có phù hợp với: **Xây dựng ứng dụng web hỗ trợ sinh viên quản lý học tập và tài chính cá nhân**.
- Khi kiểm tra điện thoại/PWA đạt, có thể bổ sung trong mục tiêu: **Giao diện đáp ứng trên máy tính và điện thoại, hỗ trợ cài đặt dưới dạng PWA**. Nếu muốn đưa ngay vào tên: **Xây dựng ứng dụng web đa thiết bị hỗ trợ sinh viên quản lý học tập và tài chính cá nhân**.
- Chỉ đăng ký phạm vi **website và ứng dụng Android** khi thực sự cam kết có bản Android được xây dựng, cài và kiểm thử. Hiện lần kiểm tra này chưa chứng minh có bản Android riêng.
- Việc duyệt tên và phạm vi cuối cùng thuộc giảng viên hướng dẫn. Dùng được trên điện thoại vẫn là một khả năng hợp lệ của website; không bắt buộc đổi thành đề tài Android.
