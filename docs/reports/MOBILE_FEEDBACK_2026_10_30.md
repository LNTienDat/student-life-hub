# Sửa theo phản hồi điện thoại 30/10/2026

Đã triển khai online commit d4fd6c6. Xem MOBILE_RELEASE_2026_10_30.md. Nội dung bên dưới ghi quá trình sửa và kiểm chứng trước triển khai.

- Thêm thanh điều hướng cố định phía dưới trên màn hình dưới 1024px; desktop giữ nguyên. Có đủ 6 mục; TKB dùng nhãn gọn Lịch học. Menu trên vẫn hỗ trợ đăng xuất.
- Nâng nút/cửa sổ chat để tránh thanh điều hướng dưới; chừa khoảng cuộn cuối trang.
- Tài chính: hai nút Xuất Excel/Quét hóa đơn bằng nhau, Thêm giao dịch một hàng đầy đủ trên điện thoại; desktop cùng hàng khi đủ chỗ.
- Ô chọn tháng dùng phần rộng còn lại giữa hai mũi tên, bỏ giới hạn 190px trên điện thoại.
- DELETE deadline chuyển sang lưu xoaLuc thay vì xóa vĩnh viễn. Việc đang làm/đã xong đều vào Đã xóa; không phụ thuộc tùy chọn tự dọn 24h. Khôi phục đưa về chưa hoàn thành. Không cần migration mới.
- Cập nhật lời xác nhận/thông báo/mô tả Đã xóa cho thống nhất. Các deadline đã bị xóa vĩnh viễn trước bản sửa không được tự khôi phục.

Biểu đồ vẫn tự chọn các mốc đẹp theo dữ liệu lớn nhất trong 6 tháng; ví dụ max 50.000đ có thể chọn trục 0–60k, các khoảng 15k. 60k nghĩa 60.000đ, không phải hạn mức và không phải riêng tháng 6. Sửa trường hợp toàn số 0 để trục không chia thành các mốc vài đồng hiển thị 0.001k khó đọc; giá trị dưới 1.000đ dùng đơn vị đ.

Kiểm chứng: lint/build đạt, 86 kiểm thử frontend đạt, 7 kiểm thử API cleanup đạt trên CSDL tạm; 10 luồng trình duyệt cũ đạt và 1 luồng mobile mới đạt bằng Chrome. Lượt chạy lại toàn bộ API có một lần tiến trình Windows dừng bất thường; bộ API cleanup liên quan được chạy riêng và đạt. Không tính kích thước giả lập là nghiệm thu điện thoại thật. CSDL thử được tạo riêng và dọn khi xong; không thay dữ liệu local/online thật.

Ảnh: docs/qa/mobile-finance-20261030.png và mobile-deadline-20261030.png.

Sau triển khai, thử trên điện thoại: mở Tài chính, đổi tháng bằng hai mũi tên, kiểm tra các nút và thanh dưới; thêm deadline thử → xóa tay → mở Đã xóa → khôi phục; hoàn thành rồi bật tự dọn để kiểm tra cùng nơi lưu. Kiểm tra chat không che thanh điều hướng. Deadline đã xóa không còn vào chuông hoặc dashboard.
