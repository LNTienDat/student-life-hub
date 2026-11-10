# Deadline: thông báo gọn, thứ tự và lọc mức quan trọng — 26/10/2026

Chỉ sửa local; không push/deploy, không thay đổi dữ liệu tài khoản người dùng.

## Thay đổi
- Chuông hiển thị “Deadline: tên việc”; dòng dưới chỉ là ngày. Không còn “sắp hết hạn”, “Hạn chót” hoặc giờ trong thông báo deadline.
- Danh sách công việc chưa hoàn thành được xếp Khẩn cấp → Bình thường → Thấp. Trong cùng mức, hạn sớm hơn đứng trước; cùng hạn thì dùng ID ổn định.
- Công việc đã hoàn thành nằm riêng bên dưới.
- Bộ lọc “Mức quan trọng” có Tất cả mức / Khẩn cấp / Bình thường / Thấp, áp dụng cả danh sách và lịch (ô ngày và chi tiết ngày).
- Tổng công việc chưa xong ở đầu trang vẫn là tổng toàn bộ; các nhóm bên dưới phản ánh kết quả đang lọc.
- Thêm việc khi đang lọc một mức sẽ điền sẵn mức đó trong form. Sửa mức, hoàn thành, hoàn tác và xóa giữ bộ lọc đang dùng.
- Nội dung rỗng có nói rõ mức đang lọc, không báo rằng tất cả công việc đã hoàn thành.

## Các điều kiện thông báo hiện có
Theo backend/src/modules/thongbao/thongbao.controller.js:
1. Deadline chưa hoàn thành và có hạn từ hiện tại đến 24 giờ tới. Hiện chưa đưa deadline đã quá hạn vào chuông.
2. Môn có ít nhất một đầu điểm, điểm trung bình tạm tính dưới 5/10 (không yêu cầu tổng trọng số đủ 100%).
3. Chi tiêu theo danh mục vượt ngân sách đã đặt của tháng hiện tại theo giờ Việt Nam. Bằng ngân sách chưa coi là vượt.
Hiển thị là các cảnh báo còn đang thỏa điều kiện, không phải hộp thư lịch sử cố định. Không thay đổi các điều kiện này trong lần sửa.

## Kiểm thử
- 59 frontend (thêm 4 ca thứ tự/lọc/không làm thay đổi mảng nguồn/ngày hỏng và hòa thứ tự).
- Lint, bản dựng và 8 kiểm thử PWA đạt.
- 10 nhóm trình duyệt đạt: thứ tự, ba bộ lọc và công việc hoàn thành, thông báo gọn, đánh dấu đã đọc/điều hướng, lọc lịch/chi tiết ngày, hoàn thành/hoàn tác, đổi mức, tạo mới trong bộ lọc, xóa/trạng thái rỗng, mobile 390px/giao diện tối.
- API trong phép thử trình duyệt dùng fixture có trạng thái để không thay đổi dữ liệu thật. Không gọi AI/email, không sửa backend hoặc cơ sở dữ liệu.
- Thiết bị điện thoại vật lý chưa được thử.

[Minh chứng](../qa/2026-10-26-deadline-priority-browser.json)
[Danh sách desktop](../qa/deadline-priority-list-desktop.png)
[Danh sách mobile](../qa/deadline-priority-list-mobile.png)
[Chuông desktop](../qa/deadline-priority-notifications-desktop.png)
