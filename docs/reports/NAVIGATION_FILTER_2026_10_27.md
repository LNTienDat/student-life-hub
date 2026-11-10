# Điều hướng, bộ lọc và trang 404 — 27/10/2026

Chỉ local; chưa commit/push/deploy. Không thay đổi dữ liệu, API hoặc CSDL.

- Chuyển Mức quan trọng xuống dưới biểu mẫu Tạo/Sửa deadline, ngay trước danh sách/lịch kết quả. Nút thêm/hủy đặt cạnh nút Danh sách/Lịch trên đầu trang.
- Bộ lọc vẫn áp dụng cho cả hai chế độ, giữ mức khi chuyển chế độ và khôi phục đủ công việc khi chọn Tất cả mức.
- Tab máy tính và menu điện thoại dùng chung thứ tự: Hôm nay → Học tập → Thời khóa biểu → Deadline → Tài chính → Hồ sơ.
- Trang 404 đã có từ trước ở NotFound.jsx và route *. Đã xác minh khi mở đường dẫn sai: có hình 404/NOT FOUND và nút Quay về trang chủ. Người chưa đăng nhập về Login; người đã đăng nhập về Hôm nay. Giữ giao diện 404 hiện có.
- Đây là trang lỗi phía giao diện SPA; không khẳng định mọi URL trang lạ trả HTTP 404 từ hosting. API không tồn tại có xử lý 404 riêng.
- Lint/build và 6 nhóm kiểm tra trình duyệt đạt. Dùng UI Vite thật với API/phiên giả lập riêng, không ghi dữ liệu người dùng thật.
- Kiểm tra vị trí bộ lọc trong DOM, chức năng lọc, chuyển chế độ, thứ tự cả hai menu, chiều rộng 320/390px và hai trường hợp quay về từ 404.
- [Kết quả](../qa/2026-10-27-navigation-filter-browser.json), [bộ lọc](../qa/navigation-priority-filter-below-form.png), [menu mobile](../qa/navigation-mobile-order.png), [404](../qa/navigation-404-desktop.png).
- Kịch bản/log: improvement-backups/navigation-filter-20261027. Không gọi AI/email hay triển khai Render.
