# Quy trình người dùng nghiệm thu LifeHub
Cập nhật 30/10/2026. Ghi nhận theo phản hồi người dùng: phần C (email thật) đã hoàn tất kiểm thử. Phần D (online) đang chuẩn bị; điện thoại thật và AI thật chưa được ghi nhận đạt. Các thay đổi mới vẫn ở local, chưa triển khai online.

## Chuẩn bị
- Mở Mo_LifeHub.cmd; vào http://127.0.0.1:5173 và Ctrl+F5.
- Dùng tài khoản thử, dữ liệu giả; tránh xóa học kỳ chứa dữ liệu thật.
- Mỗi mục ghi Đạt / Lỗi / Chưa test, kèm ảnh nếu lỗi. Không coi toàn bộ web hết lỗi chỉ vì một vài thao tác chạy được.

## A. PC local — có thể làm trước, không cần điện thoại
| Mã | Thao tác | Kết quả cần thấy |
|---|---|---|
| U1 | Đăng nhập → tải lại → đăng xuất → Quay lại | Giữ phiên trước khi đăng xuất; sau đó không trở về dữ liệu riêng |
| U2 | Ở Học tập, áp dụng HK1 THỬ rồi HK2 THỬ, chọn lại HK1 THỬ | Hai kỳ còn trong Đã lưu; Học tập/TKB theo kỳ vừa áp dụng |
| U3 | Xóa một học kỳ thử trống, nhập tên xác nhận | Kỳ đó biến mất; kỳ còn lại và tài chính được giữ |
| U4 | Nhập điểm 8 trọng số 40%, thêm điểm 10 trọng số 70%, sửa 60% | Chặn 110%; nhận 100%; GPA 9.20 |
| U5 | TKB thứ 2: Toán 07:00–09:00; Lý 08:00–10:00 rồi sửa 09:00–10:00 | Chặn buổi trùng, nhận buổi nối tiếp |
| U6 | Thêm deadline ngày mai, hoàn thành, mở lại rồi sang Hôm nay | Deadline lại xuất hiện; Hôm nay không có nút đánh dấu hoàn thành |
| U7 | Thu 100.000đ, chi 20.000đ; sửa chi thành 30.000đ | Số dư lần lượt 80.000đ và 70.000đ; tải lại không đổi |
| U8 | Đặt ngân sách Ăn uống 20.000đ khi đã chi 30.000đ | Hiện vượt hạn mức đúng; không đổi tổng thu/chi |
| U9 | Quét lại bill cà phê và bill xăng đã gửi | Cà phê 1.916.000đ, 07/05/2023; xăng 500.000đ, 17/04/2019, Đi lại |
| U10 | Quét ảnh không có ngày; kiểm tra rồi nhập ngày bằng tay | Ngày để trống và được cảnh báo; chỉ lưu khi bạn xác nhận |
| U11 | Mở quét ảnh, bấm X lúc đang đọc; mở lại | Quét dừng; không tự lưu; có thể chọn ảnh khác |
| U12 | Nhập TKB từ ảnh, bỏ trống học kỳ | Một nhắc nhở cạnh nút lưu; điền kỳ và sửa lỗi riêng từng buổi rồi mới lưu |

Lỗi tải lượt OCR đối chiếu đã có test tự động. Không cần tự phá mạng/máy để tái hiện.

## B. RAG và AI thật
1. Trước hết dùng tìm tài liệu không bật AI: thêm văn bản giả “Thư viện thử nghiệm cho mượn 3 cuốn trong 14 ngày.”
2. Hỏi số cuốn/thời gian; mở nguồn và đối chiếu đúng đoạn.
3. Hỏi giờ mở cửa khi tài liệu không nêu; cần báo chưa đủ thông tin.
4. Đổi tài khoản; không đọc được tài liệu riêng của tài khoản trước.
5. Để thử câu trả lời Gemini: xác nhận Free Tier và Billing của đúng dự án trước, cấu hình backend rồi bật AI. Không gửi khóa vào chat.
6. Hỏi lại các câu trên và câu tư vấn học tập; kiểm tra dẫn nguồn, thông báo lỗi, tốc độ.
7. Nếu chưa xác nhận hạn mức miễn phí, để AI tắt; ghi “chưa nghiệm thu AI thật”.

## C. Email thật
Cần cấu hình nhà cung cấp HTTPS và địa chỉ gửi được phép trước. Xem EMAIL_DELIVERY.md.
1. Đăng xuất → Quên mật khẩu bằng email thử bạn kiểm soát.
2. Kiểm tra hộp thư và thư rác; mở liên kết nhận được.
3. Đặt mật khẩu mới; đăng nhập bằng mật khẩu mới.
4. Mật khẩu cũ và link đã dùng phải bị từ chối.
5. Chỉ thấy thông báo đã gửi trên web chưa đủ để đánh dấu đạt.

## D. Online — sau khi cập nhật đầy đủ
1. Sao lưu Neon và xác nhận phương án khôi phục.
2. Kiểm tra nhánh/Auto Deploy, triển khai backend, migration và frontend cùng phiên bản.
3. Chạy node scripts/check-online.mjs: health ok và commit frontend/backend trùng.
4. Mở https://student-life-hub-web.onrender.com rồi thử U1, U2, U5, U7, U9 bằng tài khoản thử.
5. Local đạt không tự làm bản online cập nhật. Bản cài cũ dùng URL cũ cũng cần kiểm tra đúng địa chỉ.

## E. Điện thoại — khi bạn thuận tiện
Chỉ làm sau D, dùng đúng URL online mới.
1. Mở bằng Chrome Android hoặc Safari iPhone, đăng nhập.
2. Thêm deadline và giao dịch: bàn phím không che nút lưu, không tràn ngang.
3. Dùng camera chụp hóa đơn, kiểm tra tiền/ngày/danh mục rồi lưu.
4. Nhập TKB từ ảnh, sửa một trường và bỏ chọn một buổi trước khi lưu.
5. Cài ứng dụng từ trình duyệt; đóng rồi mở bằng icon.
6. Thử mất mạng và kết nối lại: có trạng thái phù hợp, không tự nhân đôi giao dịch.
7. Đăng xuất rồi Quay lại: không xem được dữ liệu riêng.
8. Ghi loại máy, trình duyệt, phiên bản và kết quả. Kiểm tra kích thước bằng PC không thay cho bước này.
