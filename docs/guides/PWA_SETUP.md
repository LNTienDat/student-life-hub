# LifeHub — chuẩn bị cài trên điện thoại

## Trạng thái ngày 18/10/2026

Đã chuẩn bị PWA từ website hiện có, giữ chung giao diện React và backend. Chưa triển khai lên Internet và chưa tạo gói Android hoặc phát hành trên Google Play.

Đã có:

- Manifest, biểu tượng LifeHub dạng PNG 192/512, biểu tượng maskable và biểu tượng màn hình chính iPhone.
- Nút cài khi trình duyệt cho phép và hướng dẫn cài thủ công.
- Màn hình mất mạng khi mở các đường dẫn ứng dụng; banner mất kết nối khi trang đang mở.
- Thông báo bản cập nhật, chỉ kích hoạt/tải lại khi người dùng chọn. Không tự tải lại biểu mẫu đang nhập.
- Service worker chỉ lưu trang mất mạng và biểu tượng công khai. Không lưu API, điểm, chi tiêu, token hoặc nội dung các trang riêng tư vào Cache Storage. Các thao tác ghi không được xếp hàng gửi lại.
- Chỉ đăng ký service worker trên bản build ở môi trường an toàn (HTTPS hoặc localhost). Chế độ `npm run dev` không đăng ký service worker.
- API mặc định `/api`; Vite và Nginx trong Docker chuyển tiếp tới backend, tránh dùng nhầm localhost của điện thoại.

## Dùng thử trên máy tính

Chạy backend trong một cửa sổ ở thư mục `back`:

```powershell
npm run dev
```

Trong thư mục `front`, tạo và mở bản thử PWA:

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Mở `http://127.0.0.1:4173` bằng Chrome hoặc Edge. Đăng nhập để thử chức năng. Có thể cài từ nút “Cài LifeHub” khi trình duyệt cung cấp tùy chọn, hoặc từ menu trình duyệt.

Nếu bạn có `front/.env` đang đặt `VITE_API_URL=http://localhost:5000/api`, đổi thành `/api` trước khi build để dùng cấu hình proxy mặc định. Tệp `.env.example` đã minh họa cấu hình mới. Khi frontend và backend đặt trên hai hosting khác nhau, dùng URL HTTPS công khai của backend và cấu hình `FRONTEND_URL` phía backend phù hợp.

Máy tính dùng localhost được xem là môi trường an toàn để phát triển. Điện thoại mở địa chỉ IP máy tính qua HTTP không tương đương; để thử cài PWA trên điện thoại cần triển khai website qua HTTPS hoặc thiết lập môi trường thử HTTPS phù hợp.

## Kiểm tra thủ công trên Chrome

1. Mở DevTools → Application → Manifest: kiểm tra tên, biểu tượng, phạm vi và URL mở đầu.
2. Application → Service Workers: xác nhận `sw.js` đã active sau khi tải trang online.
3. Chọn Offline trong Network, rồi tải lại `/dashboard` hoặc `/deadline`: phải hiện màn hình mất kết nối. Bỏ Offline và thử lại: trở về ứng dụng.
4. Khi trang đang mở, ngắt mạng: phải hiện banner và thao tác lưu báo lỗi. Không có thay đổi nào được tự gửi lại sau khi mạng hồi phục.
5. Cài ứng dụng, kiểm tra icon và mở toàn màn hình. Thử đăng nhập, bàn phím, quay lại và tải tệp trên điện thoại thật.
6. Để thử cập nhật, sửa một nội dung, build và phục vụ bản mới. Quay lại tab hoặc mở lại trang; chỉ nhấn “Cập nhật và tải lại” sau khi đã lưu việc đang nhập.

PWA hiện chưa hỗ trợ xem/sửa dữ liệu cá nhân khi offline. Việc cài biểu tượng không biến các chức năng yêu cầu máy chủ thành chức năng offline.

## Kiểm tra tự động

Trong `front`:

```powershell
npm test
npm run test:pwa
node scripts/check-pwa-preview.mjs
```

- 7 kiểm thử cũ về ngày/giờ, ngân sách và đồng bộ.
- 7 kiểm thử PWA: phạm vi cache, bỏ qua API/thao tác ghi, fallback offline, cập nhật theo lựa chọn, cài đặt, theo dõi mạng, kích thước icon và đầu ra build.
- Kiểm tra HTTP local với backend giả lập: manifest, PNG, worker, offline HTML, đường dẫn SPA và proxy API. Máy chủ thử tự đóng, không ghi cơ sở dữ liệu.
- Kiểm tra mã các tệp mới/thay đổi và bản dựng thành công.
- Chưa xác nhận thao tác cài đặt trong trình duyệt/điện thoại thật. Kiểm tra HTTP không thay thế bước kiểm tra đó. Cấu hình Nginx chưa chạy kiểm chứng trong container ở đợt này.

## Bước tiếp theo để lên Google Play

1. Triển khai frontend, backend và PostgreSQL; có thể bắt đầu bằng địa chỉ HTTPS do nhà cung cấp hosting cấp, chưa bắt buộc mua tên miền riêng. Chọn hosting sau khi biết chi phí, vùng dữ liệu và giới hạn gói.
2. Kiểm tra trên điện thoại thật và hoàn thiện đăng nhập, nhập tệp, nút quay lại, khả năng phục hồi khi mất kết nối.
3. Hoàn thiện chính sách quyền riêng tư, khai báo dữ liệu và chức năng yêu cầu xóa tài khoản trong app lẫn đường dẫn web. Chưa có các phần phát hành này trong đợt PWA.
4. Tạo gói Android TWA bằng Bubblewrap, xác minh website bằng Digital Asset Links và khóa ký đúng với Play App Signing. Cần URL HTTPS thực trước bước này; không tạo assetlinks với khóa hoặc tên miền giả.
5. Chuẩn bị tài khoản Play Console, hồ sơ cửa hàng, khai báo và kiểm thử theo yêu cầu tài khoản; sau đó gửi xét duyệt. Không bảo đảm được duyệt chỉ nhờ đóng gói thành công.

Docker Compose hiện có là cấu hình local, có giá trị mật khẩu/JWT minh họa. Không dùng nguyên cấu hình này để mở dịch vụ công khai; phải thay các giá trị cấu hình, kiểm soát cổng dữ liệu và thiết lập HTTPS trước khi triển khai.

Tài liệu tham khảo:

- [Manifest](https://web.dev/learn/pwa/web-app-manifest)
- [Cài đặt PWA](https://web.dev/learn/pwa/installation-prompt)
- [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity)
- [Yêu cầu xóa tài khoản](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)
- [Kiểm thử tài khoản cá nhân Google Play](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
