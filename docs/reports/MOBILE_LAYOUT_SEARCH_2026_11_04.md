# Bố cục điện thoại và tìm giao dịch cũ — 04/11/2026

## Đã sửa ở local

- Thống nhất tên trang và điều hướng: Học tập, Lịch học, Deadline, Tài chính, Hồ sơ.
- Đưa học kỳ vào bên dưới tiêu đề Học tập/Lịch học; giữ chung học kỳ cho hai trang.
- Thu gọn hàng deadline đã hoàn thành, đặt hoàn tác và xóa hai bên nội dung. Hai khung Đã hoàn thành/Đã xóa có kích thước tiêu đề đồng đều.
- Hồ sơ giảm mô tả lặp và trang trí, căn gọn các phần thông tin/mật khẩu.
- Tài chính có phạm vi Tháng đang xem hoặc Mọi thời gian, nút xóa từ khóa và xóa bộ lọc. Phạm vi tìm kiếm không đổi số liệu, ngân sách hay biểu đồ của tháng đang xem.
- Căn số tiền và thao tác bên phải mỗi giao dịch.

## Tìm giao dịch nhập nhầm năm

1. Vào Tài chính, kéo đến danh sách giao dịch.
2. Chọn Mọi thời gian, tìm theo mô tả hoặc danh mục; có thể xóa bộ lọc nếu chưa thấy.
3. Đối chiếu ngày và tiền. Bấm bút để sửa ngày, hoặc thùng rác và xác nhận để xóa giao dịch.
4. Dấu X trong ô tìm chỉ xóa từ khóa; Xóa bộ lọc chỉ đặt lại bộ lọc, không xóa giao dịch.

## Kiểm tra

- 95 kiểm thử logic frontend; lint/build đạt.
- 13 kiểm thử trình duyệt đạt ở môi trường CSDL thử riêng, gồm tài khoản, học kỳ, điểm, trùng lịch, deadline và tìm/sửa/xóa giao dịch nhầm năm 2024. Một kiểm thử OCR ảnh thật không chạy lại trong lượt này vì không sửa OCR.
- Kiểm tra tên trang, vị trí học kỳ và không tràn ngang ở 390px và 1440px; đã xem ảnh chụp giao diện.
- Không sửa API, cấu trúc CSDL hay dữ liệu người dùng. Chưa push hoặc triển khai online lượt này.
