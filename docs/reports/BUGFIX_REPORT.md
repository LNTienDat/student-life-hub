# Kết quả sửa lỗi — 21/10/2026

## Phạm vi và kết quả

Sửa các lỗi đã xác nhận trong FUNCTIONAL_AUDIT.md và PROJECT_REVIEW_UPDATE.md. Chỉ chỉnh sửa trong dự án; giữ lại tính năng nhóm/chia sẻ đang làm, không hoàn tác mã của người dùng. Bản sao trước sửa nằm trong thư mục Git bỏ qua `improvement-backups/bugfix-20261021`.

- **96 bài backend + 12 bài frontend + 7 bài PWA = 115 bài đạt.**
- **119/119 kịch bản API mở rộng đạt**, bao gồm 20 ca từng chưa đạt ở lượt trước. Số này là một bộ đối chiếu riêng, có phần trùng phạm vi với kiểm thử tự động; không diễn giải thành 234 chức năng độc lập.
- ESLint không còn lỗi/cảnh báo; bản build production thành công.
- Sáu migration, gồm migration nhóm/chia sẻ mới, áp dụng thành công vào database rỗng. Không cần db push để tạo schema thử nữa.
- Thử trên PostgreSQL 18 riêng `slh_bugfix_20261021` ở `127.0.0.1:55439`, không ghi vào database thật hay Neon.

Minh chứng: [tổng hợp kiểm tra](../qa/2026-10-21-bugfix-summary.json), [119 kịch bản](../qa/2026-10-21-api-results.json), [đối chiếu lỗi nhóm/chia sẻ](../qa/2026-10-21-group-results.json).

## Các lỗi đã xử lý

| Nhóm | Thay đổi | Cách xác nhận |
| --- | --- | --- |
| Khôi phục mật khẩu | Chuẩn hóa email; đổi mật khẩu/email vô hiệu hóa token khôi phục cũ; tiêu thụ token bằng cập nhật có điều kiện để hai yêu cầu đồng thời không cùng thành công | Ca 105, 108, 113 và kiểm thử hồi quy API |
| Tài khoản | Chặn tên trắng, sai kiểu email/mật khẩu/hồ sơ; chuẩn hóa tên; giới hạn mật khẩu theo giới hạn 72 byte UTF-8 của bcrypt để tránh cắt ngầm | Ca 13–16; thêm kiểm tra phiên |
| Dịch vụ email lỗi | Xóa đúng token không gửi được và báo dịch vụ chưa sẵn sàng; cron thủ công không báo thành công khi gửi thất bại; callback lịch cron không còn dùng nhầm đối tượng ngữ cảnh làm ID người dùng | Ca 100, kiểm tra logic với dịch vụ email giả |
| Phiên đăng nhập | Lỗi database trả lỗi dịch vụ thay vì lỗi token; 403 thiếu quyền không xóa phiên; khôi phục phiên yêu cầu token còn hạn/đúng ID; đồng bộ đăng xuất và đổi tài khoản giữa tab; remount dữ liệu trang theo tài khoản | Ca 93; hai bài session và thử hai tab trên UI |
| Hồ sơ | Giới hạn tên thống nhất 100 ký tự; trạng thái đang tải/lỗi/thử lại; chặn bấm lưu liên tiếp | Kiểm tra UI và API |
| Điểm số | Chặn tổng trọng số vượt 100% khi thêm/sửa; dùng transaction Serializable có thử lại để chống hai thao tác đồng thời cùng vượt tổng | Ca 34 và kiểm thử ghi đồng thời |
| Hiển thị điểm | Phân biệt chưa nhập điểm với điểm 0 qua hasGrades; dữ liệu cũ có trọng số sai được gắn cảnh báo thay vì ghi đã đủ điểm | Kiểm thử API hasGrades; kiểm tra UI trọng số và GPA |
| Nhập liệu/ID | Từ chối ID có hậu tố, tên môn/deadline trắng, trạng thái rỗng, hạn chót null; chặn tháng/trang sai định dạng và tin nhắn chatbot sai kiểu | Các ca từng lỗi 25, 35, 47–49, 75–76, 96 |
| Lịch học | Phát hiện trùng giờ khi thêm/sửa, cả thao tác đồng thời; hai buổi nối tiếp được phép; nhập tệp trùng giờ bị từ chối toàn bộ | Ca 56, kiểm thử đồng thời và nhập tệp |
| Thời gian Việt Nam | Ranh giới tháng, thống kê, ngân sách, xu hướng và xuất tài chính dùng UTC+7; chuỗi ngày/giờ không có múi giờ được đọc theo giờ Việt Nam; chặn ngày không có trong lịch; thống nhất tháng của thông báo/cron | Ca 94 chạy tiến trình UTC; các ca xuất, thống kê, ngày giao dịch |
| Nhóm: phân quyền | Deadline phải thuộc đúng nhóm trên URL; thành viên đã rời/bị xóa không còn quyền sửa/xóa dù từng tạo deadline | Kiểm thử hồi quy và chạy lại hai nhóm giả |
| Nhóm: tiến độ | Chỉ trả/count tiến độ của thành viên hiện tại; giữ lịch sử trong database nhưng không dùng người đã rời để tính tỷ lệ hiện tại | Ca cũ 200% trở thành 100% với một thành viên |
| Chia sẻ lịch | Chế độ chỉ xem không có nút sửa/xóa; tắt/bật lại cấp token mới để liên kết cũ không sống lại | Kiểm thử API và UI |
| Hộp thoại | Dùng dialog chung có portal, focus trap, Escape, khóa cuộn và giới hạn chiều cao cho nhóm/chia sẻ; xác nhận xóa lịch nhận đúng tên/giờ/phòng; khóa thao tác xác nhận/submit trùng | Thử bàn phím và kiểm tra trực tiếp UI |
| Tải dữ liệu | Không để phản hồi chi tiết nhóm cũ ghi đè nhóm đang mở; tải chia sẻ có trạng thái lỗi; sao chép chỉ báo thành công sau khi clipboard hoàn tất | Rà mã, lint/build và thử dialog |
| Kiểm thử an toàn | Test nhóm dùng email ngẫu nhiên, chốt database thử và dọn theo ID tài khoản đã tạo; bỏ các deleteMany không giới hạn | Chạy cả bộ trên database riêng có tài khoản UI thử khác; tài khoản đó vẫn sử dụng được |
| Triển khai | Bổ sung migration `20261021000000_groups_and_timetable_sharing` tạo đúng bảng, cột, index và khóa ngoại | Migrate deploy vào database rỗng và chạy đầy đủ kiểm thử |

Không sửa số liệu thật hoặc tự điều chỉnh các trọng số sai đã có của người dùng. Khi gặp dữ liệu cũ vượt 100%, giao diện hiển thị cảnh báo để người dùng chỉnh theo cách chấm điểm thực tế.

## Minh chứng giao diện

Dùng tài khoản giả trong bản local riêng ở cổng 5081:

1. Nhập điểm Giữa kỳ 8/40%, rồi Cuối kỳ 6/70%: giữ form và báo “Tổng trọng số các cột điểm không được vượt quá 100%”. Không lưu cột sai. Ảnh: `improvement-backups/bugfix-20261021/weights-rejected.jpg`.
2. Sửa trọng số Cuối kỳ về 60%: lưu thành công, GPA hiển thị 6.80.
3. Mở tạo nhóm: focus ở ô nhập, Shift+Tab quay về nút cuối bên trong, Escape đóng, trả focus về nút mở và mở lại cuộn nền.
4. Hộp xác nhận xóa buổi học hiển thị đúng tên “Lịch học kiểm thử”, Thứ 2, 07:00–09:00, phòng A101. Hủy, không xóa bằng giao diện.
5. Bật chia sẻ lịch giả: trang công khai có lịch và không có nút sửa/xóa. Tắt chia sẻ: trang đó hiển thị liên kết không tồn tại/đã tắt.
6. Hồ sơ tải đúng, giới hạn họ tên 100 ký tự. Không đổi mật khẩu thật qua UI.
7. Mở hai tab đã đăng nhập; đăng xuất ở tab thứ nhất khiến tab còn lại tự chuyển về login.

Trong khi kiểm tra, việc dựng lại frontend làm một tab đang mở tham chiếu tới tệp lazy-load cũ và hiện ErrorBoundary. Nút tải lại đưa về bản dựng cuối và trang hồ sơ tải bình thường. Không coi tình huống thay tệp giữa lượt thử này là lỗi render hồ sơ; người dùng vẫn cần áp dụng cập nhật PWA khi bản mới xuất hiện.

## Giới hạn và công việc vận hành

- Đây là bản sửa **trong mã local**, chưa commit/push hoặc deploy lên Render trong đợt này. Ứng dụng desktop dùng địa chỉ online chưa tự nhận các sửa đổi này.
- Chưa áp dụng migration lên database thật. Khi triển khai cần kiểm tra schema/migration hiện có và sao lưu phù hợp; không dùng db push tùy tiện vào dữ liệu thật.
- Email nhận thư thật và AI vẫn cần cấu hình dịch vụ. Đã sửa xử lý lỗi, chưa tuyên bố hai dịch vụ này đã hoạt động online. Không thêm thẻ hoặc dịch vụ trả phí.
- Cơ chế ngủ của Render Free và trang đánh thức máy chủ vẫn là giới hạn hosting; đợt sửa mã này không loại bỏ được giới hạn đó.
- Chưa thử điện thoại vật lý hoặc tải lớn. Các phần còn thiếu về phạm vi tính năng trong MODULE_COMPLETION.md không tự được coi là hoàn tất sau đợt sửa lỗi.
- Không cam kết phần mềm không thể phát sinh lỗi mới; các lỗi đã xác nhận trong phạm vi trên đã có bản sửa và minh chứng kiểm tra.
