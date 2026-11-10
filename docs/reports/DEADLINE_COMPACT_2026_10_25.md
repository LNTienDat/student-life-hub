# Thu gọn deadline và làm rõ thao tác trên Hôm nay — 25/10/2026

Phản hồi thủ công: thẻ deadline quá cao; sau hoàn thành rồi hoàn tác, nút “✓ Hoàn thành” trên Hôm nay bị hiểu là trạng thái.

## Thay đổi

- Thẻ cần làm và đã hoàn thành dùng cùng bố cục gọn. Nút sửa/xóa nằm ngang và luôn nhìn thấy, giữ vùng bấm 44×44px.
- Tiêu đề dài tự xuống dòng; màn hình nhỏ đưa nhóm thao tác xuống dưới nội dung để không bị cắt.
- Thẻ ngắn đo được 70px chiều cao ở viewport 1440px; không áp dụng chiều cao cố định cho tiêu đề dài.
- Đổi nhãn nút trên Hôm nay thành “Đánh dấu xong”, aria-label “Đánh dấu hoàn thành: …”.
- Không sửa dữ liệu hay logic trạng thái của người dùng. Ảnh thể hiện một nút hành động; kiểm thử chưa tái hiện trạng thái đã hoàn thành bị giữ sai sau hoàn tác.

## Xác minh

12 nhóm trình duyệt đạt với frontend production build, Express và PostgreSQL thử riêng:
- Hoàn thành ở Deadline ghi hoan_thanh vào CSDL và đưa vào nhóm đã hoàn thành.
- Công việc đã hoàn thành không còn trong Việc cần làm trên Hôm nay.
- Hoàn tác trong tab khác ghi cho_xu_ly, cập nhật Hôm nay khi quay lại tab, công việc xuất hiện cùng nút Đánh dấu xong.
- F5 vẫn giữ đúng trạng thái chưa hoàn thành.
- Bấm nút Hôm nay liên tiếp chỉ gửi một lần và hoàn thành đúng.
- Thẻ gọn, thao tác nhìn thấy, các bề rộng 320/390/768px không tràn ngang, vùng bấm đủ 44px.
- Kiểm tra giao diện tối trên mobile mô phỏng, không lỗi JavaScript.

48 kiểm thử logic frontend, 8 PWA/bản dựng, lint và build đạt. Không thay đổi backend nên không chạy lại bộ backend trong đợt này. Không gọi AI/email hoặc thử điện thoại vật lý.

## Minh chứng

- [Kết quả trình duyệt](../qa/2026-10-25-deadline-compact-browser.json).
- [Danh sách desktop](../qa/deadline-compact-desktop.png).
- [Hôm nay sau hoàn tác](../qa/deadline-today-restored.png).
- [Danh sách mobile tối](../qa/deadline-compact-mobile-dark.png).
- [Hôm nay mobile](../qa/deadline-today-mobile.png).
- Kịch bản chạy lại: front/tests/browser/deadline.audit.cjs, cần CSDL local riêng có tên kết thúc _test và đã migrate; có thể cấu hình SLH_DEADLINE_TEST_DATABASE_URL.

Bản sửa được phục vụ trên Vite local; đã kiểm tra mã mới và backend health HTTP 200. Chưa push/deploy.
