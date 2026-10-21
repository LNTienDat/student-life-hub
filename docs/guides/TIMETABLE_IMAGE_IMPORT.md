# Nhập thời khóa biểu từ ảnh

Bản local ngày 21/10/2026. Chưa đẩy GitHub, chưa triển khai Render.

## Dùng thử

Mở http://127.0.0.1:5173/thoi-khoa-bieu, đăng nhập tài khoản local. Chọn **Nhập lịch từ ảnh → Chọn ảnh** (hoặc Chụp ảnh trên thiết bị hỗ trợ). Nhận JPG/PNG/WebP tối đa 10 MB. Kiểm tra tên môn, thứ, giờ, phòng, giảng viên và học kỳ. Bỏ chọn buổi nghỉ, sửa dòng còn thiếu hoặc trùng giờ. Chỉ khi bấm **Lưu … buổi học**, dữ liệu mới được thêm. Ảnh và chữ nhận diện không được gửi lên máy chủ; máy chủ chỉ nhận các dòng lịch đã chọn dưới dạng CSV khi xác nhận.

Giao diện hiện lưu lịch **lặp hằng tuần theo học kỳ**, không lưu biến động riêng cho từng tuần/ngày. Một ảnh lịch tuần là nguồn nhập mẫu, không chứng minh các tuần khác giống nhau. Chưa bổ sung lịch nghỉ theo ngày hoặc tuần luân phiên.

Ảnh mờ/nghiêng, mất tiêu đề cột, lịch khác bố cục, dấu tiếng Việt và mã phòng có thể nhận diện sai. Có màn hình chỉnh sửa và nút thêm/bỏ dòng; không hứa đọc đúng mọi ảnh. Nếu không tìm được thứ, để trống để người dùng chọn, không tự đoán Thứ Hai. Buổi có dấu hiệu tạm ngưng/nghỉ mặc định bỏ chọn. Camera vật lý trên điện thoại chưa được nghiệm thu.

## Cách triển khai

- OCR bằng Tesseract.js 7.0.0, mô hình vie/eng 1.0.0, xử lý trong Web Worker tại trình duyệt; không cần khóa AI hoặc API trả phí.
- Vite đóng gói worker, WebAssembly và mô hình vào `/ocr/v7/` từ phụ thuộc npm; không tải mã thực thi/mô hình từ CDN bên ngoài. Tài nguyên này chỉ tải khi dùng nhận diện; lần đầu khoảng 19 MB tài nguyên worker/core/mô hình trước cache/nén. Hiệu năng tùy thiết bị; thời gian đo trên Chrome local không là cam kết tốc độ trên điện thoại.
- Plugin hỗ trợ cả `npm run dev` và bản production. Không cache ảnh hoặc dữ liệu riêng trong service worker. IndexedDB của thư viện chỉ cache mô hình ngôn ngữ.
- Bộ phân tích chia ảnh theo tiêu đề T2–CN, ghép chữ theo tọa độ, suy ra buổi từ khoảng giờ; có cách đọc lịch dạng danh sách. Các trường đều sửa được.
- Dùng endpoint `/api/imports/commit` hiện có: máy chủ xác thực, gán chủ sở hữu, kiểm tra lại CSV, bỏ qua bản trùng và lưu cả đợt bằng transaction. Xung đột giờ chặn cả đợt. Không tự thử lại thao tác lưu khi mất phản hồi.
- Nếu frontend có Content-Security-Policy, `script-src` cần thêm `'wasm-unsafe-eval'` và `worker-src 'self'`; không cần mở `'unsafe-eval'` hoặc nguồn script bên ngoài. `back/app.js` và blueprint `render-static.yaml` đã cập nhật. Nếu đặt headers thủ công trên Static Site, cần sửa header tương ứng khi triển khai sau này.
- Mô hình không chứa quy tắc học vụ của trường; không tự đổi tiết sang giờ khi ảnh không ghi giờ rõ ràng.

## Xác minh

- 103 bài backend trên PostgreSQL 18 mới, riêng biệt, 6 migration; database thử đã dừng và xóa. [Kết quả](../qa/2026-10-21-image-import-backend.json).
- 35 bài logic frontend và 7 bài PWA đạt; lint/build đạt.
- [Kiểm tra Chrome](../qa/2026-10-21-timetable-image-browser.json): OCR thật trên ảnh do người dùng cung cấp, nhận 6 buổi với đúng thứ/giờ, bỏ chọn 1 buổi tạm ngưng. Đọc ảnh chưa ghi dữ liệu; sau sửa, một lần xác nhận lưu 5 buổi. Phát hiện nhập lặp, chặn trùng giờ, hủy nhận diện và ảnh hỏng. Màn hình 390px không tràn ngang; thử CSP nghiêm ngặt và chỉ tải OCR cùng nguồn. API thử dùng bộ parse/commit thật với transaction trong RAM; không kết nối database online.
- Đã thử OCR thật trên chế độ Vite dev, nhận 6 dòng. Máy chủ local trả health OK. Không dùng tài khoản hoặc mật khẩu người dùng trong bài thử.
- Ảnh minh chứng dùng tên môn/giảng viên giả: [máy tính](../qa/timetable-image-preview-desktop.png), [điện thoại](../qa/timetable-image-preview-mobile.png). Chữ OCR gốc và ảnh gốc chỉ ở vùng backup local bị Git bỏ qua.

Nguồn thư viện: [Tesseract.js](https://github.com/naptha/tesseract.js), [tự phục vụ worker/core/mô hình](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md), [mô hình ngôn ngữ](https://github.com/naptha/tessdata).

## Phát hành sau khi chốt

Bản này hiện chỉ được lưu trên máy. Đẩy GitHub có thể kích hoạt Render nếu Auto Deploy đang bật. Muốn cập nhật có kiểm soát, kiểm tra/tắt Auto Deploy trước rồi mới push và triển khai nhánh `codex/student-life-hub-render`. Cập nhật Static Site để có tính năng; nếu còn sử dụng giao diện gộp ở Web Service thì cập nhật Web Service để dùng CSP cho WebAssembly. Không thay database, không cần migration mới, không đổi Neon/JWT.
