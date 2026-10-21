# Kiểm tra chức năng — 20/10/2026

## Kết quả và phạm vi

- Bộ kiểm thử có sẵn: **80 backend + 10 frontend + 7 PWA = 97 bài đạt**. Kiểm tra lint và build frontend đạt.
- Bộ kiểm tra mở rộng: **119 kịch bản, 99 đạt, 20 chưa đạt**. Đây là số kịch bản, không phải 20 lỗi độc lập hay tỷ lệ hoàn thiện sản phẩm.
- Kết quả chi tiết: [docs/qa/2026-10-20-api-results.json](../qa/2026-10-20-api-results.json).
- Công cụ tái hiện: [back/scripts/functional-audit.cjs](../../back/scripts/functional-audit.cjs). Công cụ cố ý trả exit code 1 khi tìm thấy hành vi chưa đạt; không đưa vào CI như một bộ kiểm thử đang xanh.
- Bản đối chiếu: commit `a21746f67e4c953b65eaed98297393283b3c868a`. Trong khi kiểm tra, schema và Prisma Client dùng chung được một tiến trình khác bổ sung nhóm học tập/chia sẻ. Vì vậy lượt cuối dùng bản sao mã nguồn ở commit này cùng Prisma Client sinh riêng; không hoàn tác thay đổi đang có của người dùng.
- PostgreSQL 18 thử nghiệm riêng tại `127.0.0.1:55439`, database `slh_functional_audit`; toàn bộ dữ liệu nằm trong thư mục dự án. Không dùng database local đang làm việc hoặc Neon online.
- Email được thu vào bộ nhớ hoặc mô phỏng lỗi; **không gửi thư thật**. Khóa AI bị tắt trong môi trường thử, không gửi dữ liệu sang Gemini.

## Lỗi đã tái hiện

P1: cần ưu tiên trước khi nghiệm thu phần liên quan. P2: lỗi chức năng/nhập liệu cần sửa trong đợt hoàn thiện phần đó. Số ca dưới đây là thứ tự trong tệp JSON.

| Mức | Ca | Hiện tượng thực tế | Kỳ vọng và ảnh hưởng |
| --- | --- | --- | --- |
| P1 | 105 | Yêu cầu liên kết khôi phục, đổi mật khẩu bằng mật khẩu cũ, rồi dùng liên kết đã cấp trước đó vẫn đổi tiếp thành công (200) | Đổi mật khẩu phải vô hiệu hóa liên kết khôi phục cũ; liên kết cũ còn hiệu lực tạo rủi ro nếu đã bị lộ |
| P1 | 113 | Gửi đồng thời hai yêu cầu với cùng token khôi phục: cả hai trả 200 | Token chỉ được tiêu thụ một lần, kể cả yêu cầu đồng thời; cần cập nhật có điều kiện trong database |
| P1 | 94 | Khi tiến trình dùng UTC, giao dịch `2026-10-01 00:30 +07:00` không nằm trong bộ lọc tháng 10 | Nếu ứng dụng phục vụ lịch Việt Nam, dữ liệu này thuộc tháng 10; cần thống nhất ranh giới ngày/tháng phía server |
| P2 | 34 và UI | Lưu hai trọng số 40% + 70% được chấp nhận; UI tính 6.73 và ghi “Đạt · đã đủ điểm” | Không tính điểm hoàn chỉnh từ tổng trọng số sai; cần kiểm tra cả thêm/sửa/nhập tệp |
| P2 | 56 | Hai lớp cùng học kỳ, cùng thứ, 07:00–09:00 và 08:00–10:00 đều được tạo (201) | Phát hiện trùng lịch; kịch bản chọn từ chối 409, hoặc sản phẩm phải có cảnh báo rõ nếu cho phép tiếp tục |
| P2 | 13, 15, 16, 96 | Tên hồ sơ null, email đăng nhập dạng số, mật khẩu đăng ký dạng số hoặc tin nhắn chatbot dạng số gây 500 | Dữ liệu không hợp lệ phải bị từ chối bằng thông báo nhập liệu, không gây lỗi máy chủ |
| P2 | 14, 25, 47 | Tên hồ sơ, tên môn và tiêu đề deadline chỉ có khoảng trắng vẫn được lưu | Chuẩn hóa chuỗi và từ chối nội dung rỗng sau khi bỏ khoảng trắng |
| P2 | 35 | Đường dẫn sửa môn có ID dạng `123junk` vẫn sửa bản ghi 123 của chính tài khoản đó | Kiểm tra toàn bộ ID. Trong ca này phân quyền vẫn giới hạn đúng chủ sở hữu; không kết luận có vượt quyền |
| P2 | 48 | Sửa trạng thái deadline thành chuỗi rỗng trả 200 và lưu giá trị rỗng | Trạng thái phải thuộc tập giá trị hợp lệ, tránh việc biến mất khỏi bộ lọc/thông báo |
| P2 | 49 | Sửa hạn chót bằng null trả 404, do bỏ qua giá trị và thực hiện cập nhật rỗng | Báo đầu vào không hợp lệ, không báo nhầm thành bản ghi không tồn tại |
| P2 | 75, 76 | Tháng 13 và trang `oops` vẫn trả 200 | Không tự cuộn sang năm sau hoặc âm thầm thay bộ lọc; cần thông báo hoặc quy tắc chuẩn hóa rõ ràng |
| P2 | 93 | Mô phỏng database lỗi trong xác thực: API trả 403 “token không hợp lệ/hết hạn” | Phân biệt lỗi hệ thống với lỗi phiên. Frontend hiện xóa phiên khi nhận 403 nên có thể đẩy người dùng ra ngoài vì sự cố database |
| P2 | 100 | Mô phỏng gửi email nhắc hạn thất bại, API kích hoạt cron vẫn trả 200 | Phản hồi phải cho biết gửi thất bại hoặc thành công một phần; hiện có thể tạo cảm giác đã gửi thành công |
| P2 | 108 | Email viết hoa trong yêu cầu đặt lại mật khẩu khiến liên kết hợp lệ bị từ chối 400 | Chuẩn hóa email nhất quán với đăng nhập và yêu cầu khôi phục |

Nhóm tài khoản/khôi phục là đợt sửa đầu tiên theo [MODULE_COMPLETION.md](../planning/MODULE_COMPLETION.md). Các lỗi phần khác được ghi nhận, chưa sửa đồng loạt trong lượt kiểm tra này.

## Các luồng đã đạt trong phạm vi thử

- Tài khoản: đăng ký hai tài khoản, đăng nhập với email chuẩn hóa, chặn email trùng/mật khẩu sai, ẩn trường bí mật trong phản hồi, đọc/sửa hồ sơ với dữ liệu hợp lệ, giới hạn số lần gọi, chặn token hết hạn và token cũ sau đổi mật khẩu.
- Khôi phục: liên kết thông thường dùng được, liên kết đã dùng hoặc hết hạn bị chặn, đăng nhập bằng mật khẩu mới được. Hai lỗi về token cũ và yêu cầu đồng thời vẫn còn như bảng trên.
- Học tập: tạo/sửa/xóa môn và điểm, lọc học kỳ; bộ điểm 8×40% + 6×60% cho GPA 6.80; dự đoán mục tiêu 7 với 60% còn lại cho kết quả 6.33; đọc cảnh báo/GPA theo kỳ; xuất PDF có chữ ký tệp hợp lệ. Chưa xác nhận trực quan mọi trang của PDF xuất.
- Deadline: tạo kèm checklist, sửa checklist, hoàn thành/mở lại, lọc học kỳ, đọc danh sách sắp tới, xóa; chuông có việc sắp đến hạn và bỏ việc đã hoàn thành.
- Lịch học: tạo/đọc/sửa/xóa, lọc học kỳ, chặn giờ sai và giờ kết thúc trước bắt đầu; cho phép hai buổi nối tiếp nhau.
- Tài chính: ghi thu/chi, sửa/xóa qua API, tìm kiếm/phân trang; số dư 1.000.000 − 50.000 = 950.000 và sau sửa khoản chi thành 60.000 còn 940.000; lưu lại ngân sách không tạo bản trùng; cảnh báo vượt ngân sách đúng trong bộ dữ liệu; đọc xu hướng; xuất Excel mở được thành workbook.
- Nhập dữ liệu: xem trước/nhập CSV môn học và thời khóa biểu; nhập lại bỏ qua dòng trùng; từ chối dòng sai; xem trước/nhập XLSX môn học.
- Phân quyền: các nhóm route có bảo vệ từ chối thiếu đăng nhập; tài khoản khác không đọc dữ liệu môn/lịch/giao dịch/ngân sách của chủ sở hữu, không sửa/xóa các bản ghi đã thử hoặc gắn môn của người khác vào deadline.
- Email nhắc: với dịch vụ giả, dữ liệu gửi chỉ thuộc người gọi; đây là kiểm tra logic chọn dữ liệu, không phải xác nhận thư đến hộp thư thật.
- Chatbot: chặn nội dung rỗng và trả trạng thái chưa cấu hình khi không có khóa; chưa đánh giá câu trả lời thật.

## Thử trực tiếp trên giao diện

Dùng tài khoản giả `audit-ui@example.invalid` ở địa chỉ local riêng `http://127.0.0.1:5081`:

1. Đăng nhập, xem Hôm nay khi chưa có dữ liệu; phần tổng quan hiển thị 0.00/10. Đây vẫn là điểm cần cải thiện về cách thể hiện “chưa có điểm”.
2. Tạo môn “Cơ sở dữ liệu QA”, 3 tín chỉ, học kỳ “HK1 QA”.
3. Thêm Giữa kỳ 8 điểm/40%, GPA tạm tính 8.00; thêm Cuối kỳ 6 điểm/70%, lỗi tổng 110% được tái hiện trên giao diện.
4. Sửa trọng số Cuối kỳ về 60%, giao diện cập nhật GPA 6.80.
5. Tạo deadline “Nộp báo cáo QA” kèm checklist, kiểm tra thông báo tạo thành công, mở checklist và thấy mục đã lưu; chuông hiện 1 thông báo.

Sau bước 5 kết nối điều khiển trình duyệt bị đóng. **Chưa hoàn thành lượt kiểm tra UI toàn bộ trang**: chưa xác nhận bấm checklist, các luồng lịch học/tài chính/hồ sơ, đăng xuất đa tab, chọn tệp và tải tệp từ trình duyệt trong đợt này. Các ca API tương ứng đạt không thay cho nghiệm thu giao diện. Không có thử nghiệm điện thoại vật lý.

Ảnh lỗi điểm: `improvement-backups/functional-audit-20261020/weights-110.jpg`. Tệp PDF/Excel mẫu và bản sao nguồn kiểm tra cũng nằm trong thư mục này, được bỏ qua bởi Git.

## Bản online và giới hạn

Kiểm tra chỉ đọc lúc 22:14 ngày 20/10/2026 (UTC+7): `/api/health` trả 200, trạng thái database `ok`; `/login` trả 200 và có điểm gắn ứng dụng. Không tạo tài khoản hoặc sửa/xóa dữ liệu online trong đợt này.

- Email thật và Gemini chưa được nghiệm thu. Theo hồ sơ triển khai trước đó, hai dịch vụ này chưa cấu hình trên bản online; không đọc lại khóa hoặc thông tin bí mật để kiểm tra.
- Nhóm học tập/chia sẻ mới xuất hiện trong schema trong lúc kiểm tra nằm ngoài bản nguồn đã cố định, chưa được kiểm chứng ở đây.
- Chưa đánh giá tải lớn, mọi tổ hợp dữ liệu, tất cả trình duyệt, mọi đường dẫn tấn công hoặc khả năng khôi phục database từ bản sao lưu.
- Không sửa mã nghiệp vụ hoặc triển khai bản mới trong đợt này. Việc bổ sung công cụ kiểm tra và báo cáo chỉ thực hiện trong thư mục dự án.

## Cách chạy lại bộ mở rộng

Cần một PostgreSQL thử nghiệm riêng với database `slh_functional_audit` ở loopback cổng 55439, áp dụng migrations của đúng phiên bản mã đang kiểm tra. Công cụ có chốt kiểm tra địa chỉ/tên database và từ chối chạy ở nơi khác. Bản sao nguồn cố định và Prisma Client riêng của lượt này nằm trong `improvement-backups/functional-audit-20261020/baseline/back`.

Từ thư mục `back`, sau khi khởi động lại đúng database thử nghiệm:

```powershell
$env:DATABASE_URL='postgresql://slh_audit@127.0.0.1:55439/slh_functional_audit?schema=public'
$env:SLH_AUDIT_BASELINE='true'
node scripts/functional-audit.cjs
```

Giá trị trên chỉ dành cho cluster thử nghiệm local, không phải thông tin truy cập database thật. `SLH_AUDIT_BASELINE=true` đọc bản sao đã cố định; bỏ biến này để thử mã đang làm việc sau khi schema, migrations và Prisma Client đã đồng bộ. Không dùng kết quả từ một lượt khởi chạy lỗi schema để thay kết quả nghiệm thu.
