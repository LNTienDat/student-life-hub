# Hôm nay gọn và cảnh báo deadline — 25/10/2026

Theo yêu cầu người dùng:
- Bỏ hoàn toàn nút mở/thu gọn và phần biểu đồ khỏi Hôm nay; xóa component DashboardCharts không còn dùng.
- Bỏ truy vấn GPA theo kỳ chỉ phục vụ biểu đồ ở Hôm nay. Các biểu đồ trong trang chi tiết vẫn được giữ.
- Mỗi deadline đến hạn từ hôm nay đến hết ngày thứ ba tới có dấu chấm than trắng trong vòng tròn đỏ. Deadline quá hạn cũng được cảnh báo.
- Mốc ngày dùng Asia/Ho_Chi_Minh, bao gồm deadline chỉ nhập ngày ở 23:59:59.999. Ví dụ ngày 25/10 cảnh báo đến hết 28/10; từ 29/10 chưa cảnh báo.
- Vòng sáng ngoài icon chuyển động nhẹ chu kỳ 2,4 giây; dừng chuyển động khi bật prefers-reduced-motion. Có nhãn cảnh báo cho công cụ đọc màn hình và tooltip.
- Khối deadline vẫn chỉ tóm tắt và dẫn sang mục Deadline, không có nút hoàn thành.

## Xác minh

- 51 kiểm thử frontend đạt, gồm 3 kiểm thử mới cho ranh giới 3 ngày, ngày Việt Nam, quá hạn, hoàn thành và đổi tháng/năm/năm nhuận.
- 8 PWA/bản dựng, lint và build đạt.
- 16 nhóm trình duyệt đạt với frontend production, API thật và PostgreSQL thử riêng. Kiểm tra không có biểu đồ trên Hôm nay dù có dữ liệu GPA/chi tiêu; không gọi GPA theo kỳ từ trang này; cảnh báo đúng mốc, cảnh báo quá hạn, không cảnh báo từ ngày thứ tư hoặc việc đã xong; CSS động và giảm chuyển động; biểu đồ Tài chính vẫn hoạt động; hoàn thành/hoàn tác tại Deadline cập nhật tóm tắt qua hai tab/F5; kích thước 320/390/768px và giao diện tối.
- Không lỗi JavaScript. Không gọi AI/email, chưa thử điện thoại vật lý.

Bằng chứng: [kết quả trình duyệt](../qa/2026-10-25-dashboard-alert-browser.json), [desktop](../qa/dashboard-alert-desktop.png), [mobile tối](../qa/dashboard-alert-mobile.png).
Kịch bản chạy lại: front/tests/browser/deadline.audit.cjs (CSDL local riêng có đuôi _test qua SLH_DEADLINE_TEST_DATABASE_URL).

Chỉ cập nhật local; chưa push/deploy. Các ảnh minh chứng dùng tài khoản và dữ liệu giả.
