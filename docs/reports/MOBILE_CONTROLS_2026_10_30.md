# Căn lại thao tác điện thoại — 30/10/2026

Phiên bản triển khai: ccc169a8750c3148a8959c938a797785fdb99e74, nhánh codex/student-life-hub-render.

Đã push/deploy online. CI GitHub run 41076549428 thành công cả hai job. Công cụ check-online xác nhận frontend/backend cùng ccc169a, health ok. Lần chọn commit cụ thể đầu tiên Render báo Live nhưng URL backend vẫn trả d4fd6c6; đã triển khai lại Deploy latest commit và đối chiếu thành công trước khi báo hoàn tất. Không thay schema hay cấu hình dịch vụ, không chuyển dữ liệu local lên Neon. Minh chứng: improvement-backups/controls-release-20261030/version.json và render-live.png.

- Bỏ menu điều hướng xổ xuống trên điện thoại; thanh dưới chứa đủ sáu mục. Nút đăng xuất riêng vẫn ở đầu trang.
- Ba nút thêm nhanh trên Hôm nay dùng cùng màu nền khi chưa chọn; chỉ nút có biểu mẫu đang mở được tô màu, phản ánh bằng aria-pressed/aria-expanded.
- Học tập: GPA và Xuất PDF hai ô đều nhau; Thêm môn học chiếm hàng dưới trên điện thoại. PDF có nhãn rõ ràng thay vì chỉ icon.
- Deadline: Danh sách/Lịch hai ô đều nhau, Thêm deadline chiếm hàng dưới; desktop vẫn bố trí theo chiều ngang khi đủ chỗ.
- Thanh học kỳ gọn một hàng, giữ tên kỳ và nút đổi bên phải; ẩn biểu tượng trang trí ở màn hình nhỏ. Hộp đổi/xóa học kỳ và dữ liệu giữ nguyên.

Lint/build đạt; kiểm thử trình duyệt bằng Chrome 390×844 đạt lựa chọn nút, menu, chiều cao thanh học kỳ, độ rộng thao tác và không tràn ngang. Một lượt bị người dùng ngắt, một tiến trình Windows dừng bất thường và một bài kiểm thử dùng sai role đã được xử lý; lượt cuối đạt. CSDL thử tạo riêng, không dùng tài khoản thật. Không coi kích thước giả lập là nghiệm thu điện thoại vật lý.

Ảnh local: docs/qa/mobile-today-actions-20261030.png, mobile-study-controls-20261030.png, mobile-deadline-controls-20261030.png.

Hướng dẫn triển khai lần sau: docs/guides/DEPLOY_STEP_BY_STEP.md (đã đưa vào commit).
