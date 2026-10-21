# Nghiệm thu từng phần — Student Life Hub

Ngày rà soát: 20/10/2026. Phạm vi: phiên bản web hiện có trong `D:\EDU\Do_An_2_SLH`.

Cập nhật 21/10: các lỗi đã tái hiện được sửa và kiểm tra lại trong [BUGFIX_REPORT.md](../reports/BUGFIX_REPORT.md). Các ô nghiệm thu tổng thể vẫn cần minh chứng tương ứng, đặc biệt cấu hình dịch vụ thật và kiểm tra bản triển khai; không tự đánh dấu hoàn tất toàn bộ phần.

Kết quả chạy thử bổ sung: [FUNCTIONAL_AUDIT.md](../reports/FUNCTIONAL_AUDIT.md) — bộ có sẵn 97 bài đạt; bộ mở rộng 119 kịch bản có 20 ca chưa đạt. Các phần chưa được đánh dấu nghiệm thu chỉ vì kiểm thử thông thường đạt.

## Cách hiểu “hoàn chỉnh”

Hoàn thành một phần nghĩa là đạt toàn bộ tiêu chí nghiệm thu đã ghi cho phần đó, có kết quả kiểm tra và ghi rõ giới hạn. Không dùng số lượng tính năng hoặc số bài kiểm thử để cam kết không còn lỗi.

Thực hiện tuần tự theo thứ tự bên dưới. Mỗi đợt chỉ xử lý một phần; lỗi mới của phần khác ghi vào danh sách chờ. Trước khi chuyển phần, cập nhật kết quả, phiên bản mã nguồn và minh chứng. Nếu thiếu dịch vụ bên ngoài, ghi rõ “chờ cấu hình/kiểm chứng”, không đánh dấu hoàn thành.

Đây là kết quả đọc mã nguồn và đối chiếu tài liệu triển khai; chưa phải một lượt nghiệm thu mới trên website online. Minh chứng đợt UX trước nằm trong [UX_REVIEW.md](../reports/UX_REVIEW.md); cấu hình và giới hạn online nằm trong [RENDER_SETUP.md](../guides/RENDER_SETUP.md). Các tài liệu này ghi nhận kết quả tại thời điểm kiểm tra, không chứng nhận mọi chức năng.

## Điều kiện chung cho mỗi phần

- [ ] Thao tác chính chạy từ giao diện đến cơ sở dữ liệu; tải lại trang vẫn đúng.
- [ ] Nhập sai, bỏ trống, bấm lưu liên tiếp và dữ liệu biên được xử lý rõ ràng.
- [ ] Có trạng thái đang tải, không có dữ liệu, lỗi và thử lại; lỗi không bị hiển thị thành danh sách rỗng.
- [ ] Hai tài khoản không xem/sửa/xóa dữ liệu của nhau; đổi tài khoản không còn dữ liệu đệm của tài khoản trước.
- [ ] Giao diện dùng được trên desktop và điện thoại; thao tác bàn phím và hai chế độ sáng/tối được kiểm tra.
- [ ] Có kiểm thử hồi quy phù hợp, thử luồng thực tế bằng dữ liệu thử và lưu kết quả; không thử xóa/sửa dữ liệu thật của người dùng.
- [ ] Bản triển khai được đối chiếu với phiên bản đã kiểm tra; còn giới hạn nào phải ghi rõ trước khi nghiệm thu.

## Thứ tự và khoảng trống đã nhận diện

Tất cả các phần dưới đây hiện **chưa được nghiệm thu trọn vẹn** theo checklist mới. Điều này không có nghĩa các chức năng đang có đều hỏng.

| Thứ tự | Phần | Khoảng trống chính | Căn cứ trong mã nguồn |
| --- | --- | --- | --- |
| 1 | Tài khoản và dữ liệu cá nhân | Kiểu dữ liệu đầu vào chưa được kiểm tra đầy đủ; phiên đăng nhập giữa nhiều tab chưa đồng bộ; email khôi phục online chưa cấu hình | `auth.controller.js`, `auth.middleware.js`, `AuthContext.jsx`, `Profile.jsx`, `RENDER_SETUP.md` |
| 2 | Học tập và điểm | Mỗi cột điểm được kiểm tra trọng số riêng, chưa kiểm soát tổng vượt 100%; cần phân biệt chưa nhập điểm với điểm 0 và đối chiếu cách tính | `academic.controller.js`, `academic.service.js`, `grade.util.js` |
| 3 | Thời khóa biểu | Chưa kiểm tra/cảnh báo buổi học trùng giờ; tên môn trong lịch là văn bản độc lập với danh sách môn | `thoikhoabieu.controller.js`, `schema.prisma` |
| 4 | Deadline và thông báo | Cần nghiệm thu mốc hạn theo giờ Việt Nam, cập nhật trạng thái và thông báo; email tự động đang tắt trên bản online | `deadline.controller.js`, `Layout.jsx`, `RENDER_SETUP.md` |
| 5 | Tài chính | Backend có sửa giao dịch nhưng giao diện chưa cung cấp; tháng/năm thống kê đang cố định ở tháng hiện tại | `finance.routes.js`, `financeService.js`, `TaiChinh.jsx` |
| 6 | Hôm nay, PWA và vận hành | Cần nghiệm thu tổng hợp sau các phần nguồn; chưa có minh chứng khôi phục bản sao lưu và thử trên điện thoại thật | `Dashboard.jsx`, `UX_REVIEW.md`, `RENDER_SETUP.md` |
| 7 | Trợ lý AI | Bản online chưa cấu hình dịch vụ AI; cần đánh giá câu trả lời, phạm vi dữ liệu và sự đồng ý của người dùng | `chatbot.controller.js`, `chatbot.service.js`, `RENDER_SETUP.md` |

## 1. Tài khoản và dữ liệu cá nhân — ưu tiên hiện tại

- [ ] Đăng ký/đăng nhập với email chuẩn hóa; từ chối sai kiểu, tên chỉ có khoảng trắng, email trùng và mật khẩu không hợp lệ bằng thông báo phù hợp.
- [ ] Hồ sơ tải được hoặc hiện lỗi có thử lại; giới hạn họ tên thống nhất giữa giao diện và API; lưu thành công phản ánh lên giao diện.
- [ ] Đổi mật khẩu/email yêu cầu xác nhận phù hợp; liên kết khôi phục cũ được xử lý an toàn sau thay đổi thông tin tài khoản.
- [ ] Token hết hạn bị xử lý đúng; lỗi cơ sở dữ liệu tạm thời không bị quy thành sai mật khẩu hoặc tự động mất phiên.
- [ ] Đăng xuất/đổi tài khoản được đồng bộ giữa các tab; dữ liệu đệm không đi theo tài khoản trước.
- [ ] Khôi phục mật khẩu chạy thực tế: nhận thư, mở liên kết, đổi mật khẩu, từ chối liên kết hết hạn/đã dùng và vô hiệu hóa phiên cũ; yêu cầu đồng thời không dùng lại được cùng liên kết.
- [ ] Người dùng biết dữ liệu nào được lưu, cách xuất dữ liệu cá nhân và cách yêu cầu/xác nhận xóa tài khoản; kiểm thử chỉ dùng tài khoản thử.

**Điểm phụ thuộc:** email chưa hoạt động trên bản online theo hồ sơ triển khai hiện có. Cần cấu hình dịch vụ gửi thư tương thích với môi trường triển khai và kiểm tra hộp thư thật trước khi nghiệm thu chức năng này. Giữ yêu cầu miễn phí; không tự nâng gói, nhập thẻ hoặc đưa khóa bí mật lên GitHub. Chưa chọn nhà cung cấp trong đợt rà soát này.

## 2. Học tập và điểm

- [ ] Thêm/sửa/xóa môn, tín chỉ và học kỳ; xác nhận ảnh hưởng tới điểm/deadline liên quan trước khi xóa.
- [ ] Điểm nằm trong thang đã công bố; tổng trọng số phần trăm không vượt 100% khi thêm, sửa hoặc nhập tệp.
- [ ] Phân biệt điểm tạm tính, điểm đủ thành phần và chưa có điểm; không trình bày chưa có điểm thành kết quả học tập 0.
- [ ] GPA theo kỳ/tích lũy, cảnh báo và dự đoán khớp các bộ số liệu tính tay, kể cả môn chưa đủ điểm.
- [ ] Nhập tệp có xem trước, báo lỗi theo dòng và quy tắc xử lý trùng rõ ràng; xuất PDF đúng dữ liệu, dấu tiếng Việt và học kỳ.

Không tuyên bố thang quy đổi là quy chế chính thức của trường khi chưa có tài liệu đối chiếu.

## 3. Thời khóa biểu

- [ ] Thêm/sửa/xóa và nhập lịch theo học kỳ; giờ hợp lệ và giờ kết thúc sau giờ bắt đầu.
- [ ] Phát hiện buổi học trùng giờ trong cùng phạm vi học kỳ; hai buổi nối tiếp đúng giờ không bị coi là trùng.
- [ ] Quy tắc liên kết/chọn tên môn được thống nhất, tránh tên khác nhau giữa lịch và danh sách môn.
- [ ] Lịch tuần, lịch hôm nay và giao diện điện thoại cùng dữ liệu; lịch không gắn học kỳ có cách hiển thị rõ ràng.

Phiên bản cơ bản dùng lịch lặp theo tuần. Ngày nghỉ, tuần học ngoại lệ và đồng bộ Google Calendar chưa là tiêu chí bắt buộc của phiên bản này.

## 4. Deadline và thông báo

- [ ] Tạo/sửa/xóa, ưu tiên, checklist, hoàn thành/mở lại và lọc theo môn/học kỳ hoạt động nhất quán.
- [ ] Danh sách, lịch và Hôm nay thống nhất với giờ Việt Nam tại trước/đúng/sau hạn và khi chuyển ngày.
- [ ] Thông báo trong ứng dụng cập nhật sau thao tác; đã đọc đúng tài khoản, không lặp vô lý.
- [ ] Ghi rõ kênh nhắc nào hoạt động khi mở ứng dụng, kênh nào chạy khi đóng ứng dụng; không hứa nhắc nền khi chưa triển khai.
- [ ] Nếu giữ email nhắc hạn trong phạm vi phiên bản, phải có minh chứng gửi thực tế và tránh gửi trùng; không coi việc có mã cron là đã hoạt động online.

## 5. Tài chính

- [ ] Thêm, sửa và xóa giao dịch trực tiếp trên giao diện; kiểm tra số tiền, loại, danh mục và ngày.
- [ ] Chọn tháng/năm để xem quá khứ; bộ lọc, thống kê, ngân sách và tệp xuất thể hiện rõ cùng phạm vi thời gian.
- [ ] Tổng thu, tổng chi, số dư, ngân sách và biểu đồ cập nhật đúng sau mọi thao tác; đối chiếu bộ dữ liệu tính tay.
- [ ] Có cách cập nhật và gỡ hạn mức; cảnh báo đúng khi chưa đặt, gần hết hoặc vượt hạn mức.
- [ ] Tìm kiếm/phân trang, dữ liệu rỗng, lỗi tải và xuất Excel được nghiệm thu lại bằng luồng đầy đủ.

## 6. Hôm nay, PWA và vận hành

- [ ] Mỗi số liệu/thao tác nhanh khớp phần nguồn; hoàn thành việc hoặc sửa dữ liệu cập nhật ngay phần tổng hợp.
- [ ] Cài và mở PWA đúng địa chỉ online; cập nhật phiên bản không giữ giao diện cũ ngoài ý muốn.
- [ ] Phân biệt mất mạng, máy chủ chưa phản hồi và hết phiên; có cách thử lại dễ hiểu.
- [ ] Có hướng dẫn sử dụng ngắn, thông tin quyền riêng tư, kênh báo lỗi và quy trình sao lưu/khôi phục đã diễn tập bằng dữ liệu thử.
- [ ] Thử trên điện thoại thật, bàn phím và hai chế độ màu; ghi nhận kết quả kiểm tra triển khai và các giới hạn tài nguyên.

PWA hiện không hỗ trợ nhập/sửa dữ liệu offline. Việc này là giới hạn công bố, không phải yêu cầu tự mở rộng thành một dự án đồng bộ offline.

## 7. Trợ lý AI — sau khi chức năng cốt lõi đạt nghiệm thu

- [ ] Dịch vụ thực sự hoạt động, có thông báo rõ khi chưa cấu hình, hết hạn mức hoặc lỗi; không yêu cầu người dùng thường tự chỉnh file cấu hình.
- [ ] Chỉ dùng dữ liệu tài khoản hiện tại; giải thích và xin đồng ý trước khi gửi dữ liệu cá nhân sang dịch vụ AI.
- [ ] Bộ câu hỏi mẫu có đáp án đối chiếu về điểm, lịch, deadline và thu/chi; xử lý câu hỏi thiếu dữ liệu, sai phạm vi và nội dung cố dẫn AI làm trái yêu cầu.
- [ ] Câu trả lời không tự ghi/sửa/xóa dữ liệu và không khẳng định số liệu khi thiếu căn cứ.
- [ ] Có đánh giá chất lượng và giới hạn; không gọi cách ghép dữ liệu vào prompt là đã xây dựng RAG hoàn chỉnh.

AI là đợt nghiệm thu riêng, không trì hoãn việc nghiệm thu phần cốt lõi đã ổn định chỉ để bổ sung tính năng nâng cao.

## Mẫu ghi nhận khi đóng một phần

| Nội dung | Kết quả |
| --- | --- |
| Phần / ngày / phiên bản | Chưa nghiệm thu |
| Tiêu chí đạt / chưa đạt | Đối chiếu từng ô ở trên và điều kiện chung |
| Kiểm thử tự động | Lệnh, môi trường, kết quả hoặc đường dẫn CI |
| Thử luồng thực tế | Kịch bản, dữ liệu thử, kết quả và ảnh nếu cần |
| Bản online | Phiên bản triển khai và kết quả kiểm tra |
| Giới hạn / lỗi còn mở | Ghi rõ; không đánh dấu đạt khi còn tiêu chí bắt buộc chưa đạt |
