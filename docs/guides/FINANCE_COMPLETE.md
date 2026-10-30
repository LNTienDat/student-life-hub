# Tài chính — bản local ngày 24/10/2026

## Phần đã hoàn thiện

- Thêm, sửa và xóa giao dịch trên giao diện. Sửa dùng API PUT, không tạo bản ghi mới. Hủy giữ dữ liệu hiện có; lỗi lưu giữ nguyên nội dung đang nhập. Chặn bấm lưu lặp.
- Chọn tháng/năm, chuyển tháng trước/sau và quay lại tháng hiện tại. Tổng thu, tổng chi, số dư, ngân sách, danh sách và Excel cùng dùng kỳ đã chọn. Biểu đồ hiển thị 6 tháng kết thúc tại kỳ đó.
- Số dư là **thu trừ chi trong tháng**, không phải số dư cộng dồn mọi tháng.
- Bộ lọc loại, danh mục, tìm kiếm và phân trang chỉ áp dụng danh sách. Tổng quan và ngân sách vẫn tính toàn tháng; có nhãn giải thích trên giao diện.
- Ngày giao dịch mới mặc định hôm nay nếu đang xem tháng hiện tại, hoặc ngày 1 của tháng được chọn. Người dùng có thể đổi ngày. Khi sửa tiền/mô tả mà không đổi ngày, giữ nguyên thời điểm gốc.
- Ngày và ranh giới tháng thống nhất theo giờ Việt Nam, kể cả khi xem bằng thiết bị ở múi giờ khác và khi xuất Excel.
- Chuyển ngày giao dịch sang tháng khác sẽ cập nhật thống kê và ngân sách của các tháng liên quan; giao dịch xuất hiện tại tháng mới. Đổi thu/chi sẽ chọn lại danh mục phù hợp.
- Sửa hạn mức ngân sách theo tháng đang xem; cùng danh mục ở tháng khác giữ nguyên.
- Bảo vệ dữ liệu chưa lưu khi đổi tháng, mở giao dịch khác hoặc đóng biểu mẫu. Khóa đổi kỳ trong lúc đang ghi dữ liệu.
- Khi đổi tháng/bộ lọc nhanh, phản hồi cũ không ghi đè kỳ mới. Xóa giao dịch cuối trang sẽ trở về trang hợp lệ.
- Các thay đổi thành công làm mới dữ liệu và thông báo cho tab khác. Xuất Excel đúng kỳ, không âm thầm cắt báo cáo khi vượt giới hạn 10.000 dòng.
- Giữ cách nhập tiền có khoảng cách: 100 000; gửi lên API là số 100000. Không chấp nhận tiền nguyên vượt phạm vi số chính xác của JavaScript.

## Kiểm thử và minh chứng

- Backend chạy trên PostgreSQL 18 riêng, tài khoản và dữ liệu giả. Bao gồm đối chiếu danh sách/tổng thu chi/ngân sách/biểu đồ/Excel ở ranh giới tháng Việt Nam, chuyển ngày và loại giao dịch, quyền tài khoản và kỳ không hợp lệ. Xem [kết quả backend](../qa/2026-10-24-finance-backend.json).
- Trình duyệt chạy bản frontend production với **Express API thật và PostgreSQL thử riêng**. 12 nhóm thao tác gồm thêm/sửa/xóa, lỗi lưu giả lập, chống gửi lặp, đổi tháng, bảo vệ bản nhập, ngân sách, tải/mở Excel, phân trang, phản hồi chậm, kích thước 390px và giao diện tối. [Kết quả](../qa/2026-10-24-finance-browser.json).
- [Giao diện máy tính](../qa/finance-period-desktop.png), [điện thoại](../qa/finance-period-mobile.png), [nhập tiền trên màn hình nhỏ](../qa/finance-entry-mobile.png).

Đã kiểm tra kích thước điện thoại bằng trình duyệt; chưa thao tác trên điện thoại vật lý. Các minh chứng chỉ xác nhận các tình huống và phiên bản đã thử, không bảo đảm mọi tình huống tương lai đều không có lỗi.

## Chạy thử

Mở http://127.0.0.1:5173/tai-chinh, dùng tài khoản local. Có thể thử chọn tháng trước, thêm thu 100 000 đ và chi 20 000 đ, sửa khoản chi thành 30 000 đ rồi kiểm tra số dư 70 000 đ; hủy/xác nhận xóa và tải báo cáo.

## Triển khai

Chưa đẩy GitHub, chưa triển khai Render. Không đổi schema và không cần migration mới. Khi muốn đưa online cần cập nhật cả backend (biểu đồ theo kỳ và Excel) và Static Site (giao diện), sau đó kiểm tra nhanh trên bản online. Không dùng dữ liệu hoặc tài khoản thật trong các bài thử tự động.
