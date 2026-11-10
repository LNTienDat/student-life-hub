# Tối ưu LifeHub — 24/10/2026

Phạm vi: mã local tại `D:\EDU\Do_An_2_SLH`. Giữ các chức năng hiện có và dữ liệu; chưa push GitHub hoặc triển khai Render. Không thay đổi schema, không cần migration mới.

## Các thay đổi đã kiểm chứng

| Phần | Thay đổi và tác dụng |
|---|---|
| Đổi tài khoản | Chờ ghi xong cả token và thông tin người dùng trước khi đồng bộ tab khác; tránh chuyển nhầm về đăng nhập do đọc phiên dở dang. |
| Yêu cầu đang chờ | Gắn thao tác với phiên lúc bắt đầu; hủy thao tác chưa gửi nếu tài khoản đổi. Loại phản hồi cũ, kể cả lỗi 401, để không ghi đè hoặc đăng xuất tài khoản mới. |
| Thông báo và dữ liệu riêng | Dọn toast, bộ đếm giờ và giao diện cũ khi đổi tài khoản; dữ liệu môn, lịch và deadline được làm mới khi trở lại tab. |
| Nhập điểm | Hiện trọng số tối đa còn lại, chặn tổng vượt 100% ngay tại biểu mẫu; sửa được tên loại điểm. Nút sửa/xóa dễ bấm hơn và tên dài tự xuống dòng. |
| Thao tác ghi | Khóa thao tác thêm/sửa/xóa/hoàn thành trong lúc đang lưu để tránh bấm liên tiếp gửi lặp. Không tự gửi lại yêu cầu ghi khi mất phản hồi. |
| Nhập CSV/XLSX | Chọn lại được cùng tệp sau lỗi, bỏ phản hồi xem trước đã cũ; xác nhận liên tiếp chỉ nhập một lần. |
| Lịch học | Nút sửa/xóa luôn thấy được, dùng được trên màn hình cảm ứng; cập nhật phòng học được kiểm tra bằng API thật. |
| Chuông thông báo | Bao gồm việc đang chờ; chọn thông báo mở đúng trang. Môn cùng tên ở hai kỳ có mã riêng; đổi hạn tạo thông báo mới; danh mục ngân sách dùng tên tiếng Việt. |
| Tốc độ trang Hôm nay | Chỉ tải thư viện biểu đồ khi mở “Xem biểu đồ”. Kiểm tra mạng thực tế xác nhận trì hoãn tệp biểu đồ 297.934 byte; có bài hồi quy kiểm tra cả cây phụ thuộc của bản dựng. |
| Tải nền và truy vấn | Giảm làm mới lặp khi tab ẩn; tổng thu/chi và ngân sách dùng truy vấn cộng theo nhóm, giảm lượng giao dịch phải đọc về bộ nhớ. |
| Ngày và dữ liệu đầu vào | Thống nhất nhãn ngày theo giờ Việt Nam; chặn bộ lọc, ID và mô tả sai kiểu trước khi truy vấn. API dùng `Cache-Control: no-store` để tránh lưu phản hồi dữ liệu riêng. |
| Chuyển động | Tôn trọng cài đặt giảm chuyển động của thiết bị. Sáu trang chính không tràn ngang ở chiều rộng 390px trong các tình huống đã thử. |
| Thư viện | Cập nhật bản vá tương thích; `npm audit` giảm từ 11 cảnh báo (6 cao, 5 vừa) xuống 0 ở ngày kiểm tra, gồm cả thư viện phục vụ phát triển. |

Hai tab cùng trình duyệt vẫn dùng chung một phiên đăng nhập. Muốn dùng A và B cùng lúc, cần hai hồ sơ trình duyệt hoặc một cửa sổ ẩn danh.

## Kiểm thử

- **147/147 backend**, với PostgreSQL 18 thử riêng và dữ liệu giả: [kết quả](../qa/2026-10-24-optimization-backend.json).
- **48/48 logic frontend**, **7/7 PWA**, **1/1 kiểm tra phụ thuộc bản dựng**; lint và đóng gói production đạt: [kết quả](../qa/2026-10-24-optimization-frontend.json).
- Tổng **203 bài tự động đạt**.
- **11 nhóm thao tác trình duyệt** dùng frontend production, Express thật và PostgreSQL thử riêng: nhập/sửa điểm, chọn lại CSV, nhập một lần, đồng bộ tab, thông báo, hoàn thành/mở lại việc, sửa lịch, sáu trang ở 390px, OCR thật, đổi tài khoản có phản hồi 401 đến muộn và đăng xuất. [Minh chứng](../qa/2026-10-24-optimization-browser.json).
- **12 nhóm tài chính** chạy lại sau cập nhật thư viện: kỳ tháng, sửa giao dịch, lỗi lưu giữ bản nhập, bấm lặp, chuyển ngày sang tháng khác, ngân sách, xóa/hủy, phân trang, phản hồi chậm, nhập tiền, giao diện nhỏ/tối và tải/mở XLSX. [Minh chứng](../qa/2026-10-24-optimization-finance.json).
- **23 nhóm trình duyệt đạt, không có lỗi JavaScript trong các luồng này**. Đây là số nhóm kịch bản, không phải số chức năng độc lập.
- [Tổng hợp và dấu vân tay mã nguồn](../qa/2026-10-24-optimization-summary.json), [đối chiếu cảnh báo thư viện](../qa/2026-10-24-optimization-dependencies.json).

Ảnh kiểm tra: [học tập máy tính](../qa/optimization-subjects-desktop.png), [học tập điện thoại](../qa/optimization-subjects-mobile.png), [học tập tối](../qa/optimization-subjects-mobile-dark.png), [tài chính](../qa/optimization-finance-period-desktop.png), [tài chính điện thoại](../qa/optimization-finance-period-mobile.png).

## Bản vá thư viện

Frontend giữ Tailwind 3, ép `postcss-selector-parser@7.1.6` để nhận bản sửa lỗi; đã kiểm tra CSS production, giao diện sáng/tối và trình duyệt. Backend giữ ExcelJS 4, dùng `uuid@11.1.1` trong ExcelJS vì vẫn hỗ trợ cách gọi CommonJS hiện tại; xuất và đọc lại XLSX thực đã đạt. Các ràng buộc này có trong package.json và package-lock.json.

## Giới hạn còn lại

- Chưa thử trên điện thoại vật lý; mô phỏng kích thước không xác nhận camera, bàn phím và hiệu năng của mọi điện thoại.
- Không gọi Gemini hoặc gửi email thật trong đợt này; AI vẫn tắt ở local, cấu hình dịch vụ thật cần được xác nhận trước khi bật.
- OCR đã thử lại ảnh thời khóa biểu của bạn: nhận 6 buổi, bỏ chọn buổi tạm ngưng và lưu 5 buổi đã duyệt; vẫn cần người dùng kiểm tra chữ nhận diện và hiện lưu lịch lặp theo tuần.
- Bản online chưa nhận các thay đổi này. Khi đưa online cần cập nhật cả backend và Static Site rồi kiểm tra lại trên địa chỉ công khai.
- Số bài đạt và kết quả audit xác nhận phạm vi/phiên bản đã thử, không phải cam kết “100% không còn lỗi”.

## Dùng thử local

Mở [LifeHub local](http://127.0.0.1:5173). Dùng tài khoản local hiện có; tài khoản và database thử tự động tách riêng. Backend ở cổng 5000, giao diện ở cổng 5173.
