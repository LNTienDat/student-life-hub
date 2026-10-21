# Kết quả kiểm thử chức năng — 21/10/2026

Phạm vi: mã local tại `D:\EDU\Do_An_2_SLH`, database thử riêng PostgreSQL 18. Không phải kết quả nghiệm thu toàn bộ bản Render hoặc Android thật. Email được thu giữ trong tiến trình thử; không gửi email thật hoặc gọi Gemini.

## Kết quả thực tế

- Bộ backend chính: **96/96** bài, 15 bộ kiểm thử.
- Bổ sung nghiệm thu quyền sửa/rời/xóa nhóm và deadline nhóm: **3/3** bài.
- Logic frontend: **12/12** bài.
- PWA: **7/7** bài.
- Tổng cộng **118 bài kiểm thử tự động đạt**, không có bài thất bại.
- Bộ nghiệp vụ mở rộng: **119/119 kịch bản đạt**. Bộ này có phần phủ trùng với các bài ở trên; không quy đổi tổng số thành số chức năng độc lập.
- Kiểm tra mã giao diện và dựng production: đạt.
- Cả **6 migration** áp dụng thành công từ database trống.

Bằng chứng: [backend](../qa/2026-10-21-acceptance-backend.json), [nhóm bổ sung](../qa/2026-10-21-acceptance-groups.json), [119 kịch bản](../qa/2026-10-21-acceptance-api.json), [tổng hợp và dấu vân tay mã nguồn](../qa/2026-10-21-acceptance-summary.json).

## Có thể tạm chốt phần nghiệp vụ đã kiểm thử

“Đạt” ở bảng này nghĩa là những hành vi nêu rõ đã đáp ứng các bài kiểm thử trên phiên bản hiện tại. Không phải cam kết mọi thao tác giao diện, môi trường hoặc tình huống tương lai đều không có lỗi.

| Phần | Hành vi đã kiểm chứng | Mức bằng chứng |
|---|---|---|
| Đăng ký và đăng nhập | Tạo tài khoản, chuẩn hóa email, chặn trùng email/sai mật khẩu, chặn truy cập thiếu hoặc hết hạn phiên | API + PostgreSQL |
| Hồ sơ, đổi mật khẩu/email | Đọc/cập nhật hồ sơ; từ chối tên rỗng; đổi mật khẩu tạo phiên mới, vô hiệu phiên và link reset cũ; đổi email có xác nhận mật khẩu | API + PostgreSQL |
| Môn học và điểm | Thêm/xem/sửa/xóa; lọc kỳ; nhập/sửa/xóa điểm; GPA tín chỉ, GPA theo kỳ, dự đoán mục tiêu; chặn điểm ngoài thang và tổng trọng số quá 100%, kể cả ghi đồng thời | API, tính toán + PostgreSQL |
| Deadline cá nhân | Thêm/xem/sửa/xóa; checklist; hoàn thành/mở lại; lọc học kỳ; chuông hiển thị việc sắp tới và bỏ việc hoàn thành | API + PostgreSQL |
| Thời khóa biểu | Thêm/xem/sửa/xóa; lọc kỳ; chặn giờ sai, giờ đảo ngược, lịch trùng, kể cả tạo đồng thời; cho phép hai buổi liền kề | API + PostgreSQL |
| Thu chi và ngân sách | Thêm/sửa/xóa giao dịch qua API; tổng thu/chi/số dư; tìm kiếm/phân trang/lọc; đặt/cập nhật ngân sách không tạo trùng; cảnh báo vượt ngân sách, xu hướng tháng và ranh giới tháng Việt Nam | API + PostgreSQL; một số hợp đồng dữ liệu frontend |
| Nhập CSV/XLSX | Xem trước và nhập môn/lịch; bỏ bản ghi đã có; dữ liệu lỗi hoặc lịch xung đột không để lại lần nhập dở | API, tệp Excel thực + PostgreSQL |
| Nhóm học tập | Tạo/tham gia/xem/sửa/rời/giải tán; quyền chủ nhóm; tạo/sửa/xóa deadline nhóm; tiến độ; người bị loại mất quyền; chặn ghi chéo nhóm; xóa nhóm dọn bản ghi phụ thuộc | API + PostgreSQL |
| Chia sẻ lịch | Bật/tắt/xem public; link tắt không còn truy cập; bật lại đổi token để link cũ không sống lại | API + PostgreSQL |
| Cách ly dữ liệu | Người khác không được đọc/sửa/xóa tài nguyên cá nhân hoặc ghi tiến độ sang nhóm khác | API + PostgreSQL; không thay cho đánh giá bảo mật toàn diện |
| Trang Hôm nay | Phân loại việc quá hạn/hôm nay/7 ngày tới; bỏ việc đã xong; trạng thái lịch học; Chủ nhật và mốc nửa đêm/ngày cuối tháng | Kiểm thử logic, chưa phải thao tác đầy đủ trên trình duyệt |

Có thể ưu tiên các phần chưa hoàn thiện thay vì lặp lại thủ công toàn bộ những kịch bản này khi mã và môi trường chưa đổi.

## Chưa được tuyên bố hoàn tất toàn bộ

| Phần | Giới hạn cần phân biệt |
|---|---|
| Khôi phục mật khẩu | Logic link hết hạn, dùng một lần, đồng thời và thu hồi phiên đã đạt; việc gửi/nhận email thật trên bản online chưa được xác nhận |
| Email nhắc hạn/ngân sách | Mô phỏng gửi và xử lý lỗi đã đạt; chưa nghiệm thu SMTP hoặc lịch chạy thật |
| Chatbot AI | Đã kiểm tra dữ liệu đầu vào và thông báo khi chưa cấu hình; không chứng minh câu trả lời Gemini hoạt động hoặc đúng |
| Sửa giao dịch trên giao diện | API sửa đạt; bảng giao dịch hiện chưa có nút/biểu mẫu sửa, nên không đánh dấu chức năng sửa hoàn chỉnh cho người dùng |
| Xuất báo cáo | PDF có chữ ký tệp hợp lệ; Excel đọc được thành workbook. Chưa duyệt bố cục toàn bộ PDF và chưa thử tải/mở tệp trên điện thoại thật trong lượt này |
| PWA | Các bài về cache, offline, phiên, cập nhật và manifest đạt; chưa nghiệm thu cài đặt, bàn phím, chọn ngày giờ, thông báo trên Android/iOS thật |
| Giao diện | Lượt này chưa thao tác đầy đủ các nút, biểu đồ, tối/sáng, đăng xuất và nhiều tab qua trình duyệt; các kiểm tra UI trước đây không được tính là lượt mới |
| Online và vận hành | Không triển khai hoặc xác nhận bản Render có cùng mã; chưa kiểm thử tải lớn, khôi phục sao lưu hoặc đánh giá bảo mật toàn diện |
| Trang quản trị tài khoản | Chưa có trang quản trị riêng; xem database không tương đương chức năng quản trị trong website |

## Khi nào cần kiểm tra lại

Không có chức năng nào có thể được chứng nhận “100% tốt, không bao giờ cần kiểm lại”. Để tránh tốn công: chỉ lặp lại thủ công khi có lỗi mới hoặc thay đổi ảnh hưởng đến luồng đó; chạy kiểm thử tự động sau thay đổi mã/schema/thư viện/cấu hình và trước phát hành. Sau triển khai, kiểm tra nhanh đăng nhập, đọc và lưu dữ liệu trên môi trường thật. Kết quả ở đây gắn với dấu vân tay mã trong tệp tổng hợp.

Database thử và tài khoản giả được dọn sau khi lưu kết quả. Dữ liệu thật và bản online không bị thay đổi.
