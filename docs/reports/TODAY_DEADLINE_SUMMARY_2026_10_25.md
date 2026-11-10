# Hôm nay hiển thị tóm tắt deadline — 25/10/2026

Theo yêu cầu mới, khối deadline trên Hôm nay chỉ hiển thị công việc và hạn chót:
- Đã bỏ nút Đánh dấu xong và hàm cập nhật trạng thái khỏi DashboardToday.
- Tiêu đề khối là Deadline cần chú ý; có liên kết tên công việc và Mở mục Deadline.
- Hoàn thành và hoàn tác thực hiện trong mục Deadline. Thông tin Hôm nay tiếp tục cập nhật khi trạng thái thay đổi.

12 nhóm trình duyệt đạt với bản dựng production, API thật và CSDL thử riêng; kiểm tra hai tab, F5, hoàn thành/hoàn tác tại Deadline, liên kết từ Hôm nay không gửi yêu cầu ghi và giao diện 320/390/768px. Không lỗi JavaScript. 48 logic frontend, 8 PWA/bản dựng, lint/build đạt. Chưa push/deploy.

Bằng chứng: [kết quả trình duyệt](../qa/2026-10-25-deadline-summary-browser.json), [desktop](../qa/deadline-summary-desktop.png), [mobile](../qa/deadline-summary-mobile.png). Kịch bản front/tests/browser/deadline.audit.cjs đã cập nhật theo hành vi mới.

Báo cáo DEADLINE_COMPACT_2026_10_25.md trước đó lưu lịch sử phiên bản có nút Đánh dấu xong; phiên bản hiện tại đã bỏ nút theo yêu cầu tiếp theo.
