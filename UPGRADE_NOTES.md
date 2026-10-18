# Student Life Hub — cập nhật 15/10/2026

> Bổ sung ngày 18/10/2026: đã chuẩn bị PWA, biểu tượng cài đặt và xử lý mất mạng. API mặc định chuyển sang `/api`, thông qua Vite/Nginx proxy. Xem [PWA_SETUP.md](PWA_SETUP.md) để chạy thử và biết phần còn cần làm trước khi phát hành Android.

## Những thay đổi đã triển khai

1. **Dashboard gọn hơn:** giảm banner, bỏ danh sách deadline lặp bên dưới “Hôm nay”, chỉ hiện khu vực biểu đồ khi có dữ liệu.
2. **Thao tác ngay trên trang chủ:** thêm việc cần làm, thêm lịch, ghi khoản chi; hoàn thành deadline bằng một nút. Các thao tác lỗi có thông báo và không báo thành công giả.
3. **Đồng bộ số liệu:** thao tác ghi dữ liệu thành công xóa cache và thông báo cho Dashboard, kể cả tab khác cùng trình duyệt. Quay lại tab sẽ tải lại. Mỗi nguồn dữ liệu tải và báo lỗi riêng; kết quả từ lượt tải cũ bị bỏ qua. API có giới hạn thời gian chờ.
4. **Checklist:** thêm bước khi tạo/sửa deadline hoặc mở “Checklist” trên từng thẻ danh sách để thêm, xóa, đánh dấu bước. Hiện số bước hoàn thành trên trang chủ, danh sách và lịch. Checklist được lưu vào PostgreSQL, giới hạn 50 bước và 200 ký tự mỗi bước. Hoàn thành các bước không tự đánh dấu hoàn thành cả deadline; người dùng quyết định khi nào nộp xong.
5. **Học kỳ:** bộ chọn dùng chung cho Dashboard, môn học, deadline và thời khóa biểu. Lựa chọn được nhớ riêng theo tài khoản trên trình duyệt. GPA học kỳ và PDF lọc theo lựa chọn; biểu đồ xu hướng vẫn so sánh tất cả kỳ. Môn học phân biệt điểm tạm tính và đã đủ trọng số. Lịch cũ chưa xếp kỳ và deadline không gắn môn vẫn hiện; có thể sửa lịch để xếp kỳ.
6. **Nhập Excel/CSV:** mở “Nhập từ Excel / CSV” trong Học tập hoặc Thời khóa biểu. Tải mẫu, chọn tệp, xem trước và sửa dòng lỗi trong tệp trước khi xác nhận. Không lưu khi chỉ xem trước hoặc khi còn dòng lỗi. Nhập lại cùng dữ liệu sẽ bỏ qua dòng đã có của chính tài khoản đó. Lưu cả đợt trong một giao dịch.

Đã điều chỉnh độ tương phản chữ phụ và cảnh báo ở chế độ tối, cho các thanh thao tác xuống dòng trên màn hình nhỏ. Đây là thay đổi trong mã; cần xác nhận tiếp bằng giao diện thực tế.

## Nhập tệp

- Nhận `.xlsx` hoặc `.csv` UTF-8, tối đa 1 MB, 500 dòng dữ liệu.
- Excel có đúng một trang tính; không dùng ô gộp, công thức hay liên kết trong ô nhập.
- Tệp CSV dùng dấu phẩy hoặc chấm phẩy. Tên có dấu phẩy cần được bao bằng dấu nháy kép.
- Môn học: `ten,tinChi,hocKy`. Tín chỉ là số nguyên 1–20.
- Thời khóa biểu: `tenMon,thu,gioBatDau,gioKetThuc,phongHoc,giangVien,hocKy`. Thứ 2–8 (8 là Chủ nhật), giờ `HH:mm`; phòng và giảng viên được để trống.
- Dùng đúng tên cột và thứ tự từ mẫu tải trên giao diện. Học kỳ phải có giá trị khi nhập tệp.
- Dữ liệu môn trùng theo tên và học kỳ; lịch trùng theo tên, học kỳ, thứ và khung giờ. So sánh tên không phân biệt chữ hoa/thường. Nhập không sửa dữ liệu cũ; dùng nút sửa để thay đổi bản ghi đã có.

## Cơ sở dữ liệu và chạy local

Migration `20261015000000_checklist_and_semesters` thêm `Deadline.checklist` và `ThoiKhoaBieu.hocKy`, không xóa dữ liệu cũ. Đã áp dụng thành công vào PostgreSQL local trong phiên cập nhật này.

Nếu chạy bản mã này trên một cơ sở dữ liệu khác, cần chạy trong `back`:

```powershell
npx prisma migrate deploy
npx prisma generate
```

Khởi động lại backend nếu đang chạy bản cũ, rồi tải lại frontend. Không cần thay đổi `.env` cho các tính năng mới.

## Kết quả kiểm tra

- `back`: `npm test` — **50/50**, 10 nhóm kiểm thử. Có kiểm thử API xác thực, quyền sở hữu, nhập tệp, nhập lặp, từ chối toàn đợt khi có dòng lỗi; kiểm thử lưu dữ liệu và lọc học kỳ trên PostgreSQL thật.
- `front`: `node --test tests/today.test.js tests/dataEvents.test.js` — **7/7**. Bao gồm ranh giới ngày/giờ, ngân sách và đồng bộ cache/sự kiện.
- ESLint các phần mã giao diện đã thay đổi: đạt. Bản dựng frontend: thành công.
- Chưa xác nhận giao diện trực quan desktop/mobile: trình duyệt kiểm tra không kết nối được địa chỉ local. Chưa đánh giá hiệu năng với dữ liệu lớn hoặc xác nhận triển khai production.

Bản xem thử với dữ liệu giả lập nằm tại `front/tests/ui-preview.html` và chỉ cho chạy trên `http://127.0.0.1:5187`, tách khỏi tài khoản dùng trên cổng thông thường. Tệp này không nằm trong đầu vào bản dựng production. Đây là công cụ kiểm tra, không phải dữ liệu thực của sinh viên.
