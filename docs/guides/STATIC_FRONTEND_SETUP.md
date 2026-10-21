# Giao diện mở nhanh và xử lý máy chủ khởi động chậm

## Bản thay đổi ngày 21/10/2026

- `render-static.yaml` định nghĩa một Static Site mới, phục vụ React/PWA từ CDN. Không đổi hoặc xóa Web Service/Neon hiện tại.
- Static Site gọi trực tiếp API công khai `https://student-life-hub-inx4.onrender.com/api` qua HTTPS. Không dùng rewrite để chuyển các thao tác ghi qua Static Site.
- Trước yêu cầu API đầu tiên sau khoảng nghỉ, frontend kiểm tra `/api/health`. Các yêu cầu đồng thời dùng chung một lượt kiểm tra.
- Trang vẫn hiển thị trong khi chờ. Có thông báo LifeHub đang kết nối và nút thử kết nối lại nếu hết thời gian.
- Mỗi lượt chờ tối đa khoảng 90 giây, từng health probe tối đa 10 giây. Không có vòng ping khi không có yêu cầu của người dùng; không giữ Render thức liên tục.
- Chỉ GET lỗi kết nối/gateway được thử lại một lần sau kiểm tra health. POST/PUT/PATCH/DELETE không được tự phát lại sau phản hồi lỗi hoặc không rõ kết quả.
- Lỗi kết nối không xóa tài khoản/phiên. Chỉ phản hồi xác thực hết hạn/thu hồi phiên mới dẫn về đăng nhập.
- Backend thêm danh sách origin chính xác qua `ADDITIONAL_FRONTEND_URLS` và đặt health `Cache-Control: no-store`.

## Kích hoạt miễn phí trên Render

Cần kết nối tài khoản Render có quyền quản lý dịch vụ `student-life-hub`. Không gửi DATABASE_URL, mật khẩu hoặc API key vào chat. Không thay đổi dịch vụ bài tập `mern-frontend-235246`.

1. Triển khai commit mới của nhánh `codex/student-life-hub-render` cho Web Service hiện có. Build/start hiện tại vẫn dùng `scripts/render-build.mjs` và `scripts/render-start.mjs`, giữ gói Free. Migration nhóm/chia sẻ chỉ bổ sung schema; không dùng reset hoặc db push trên database thật.
2. Tạo Static Site mới từ cùng repo/nhánh bằng Blueprint path `render-static.yaml`. Hoặc tạo thủ công với các thông số bên dưới. Không nâng cấp gói, không tạo database mới.
3. Lấy URL **thực tế do Render cấp** cho Static Site. Tên `student-life-hub-web` trong cấu hình là tên dịch vụ đề xuất; không coi một địa chỉ dự đoán là đã tồn tại.
4. Trong Web Service API, đặt `ADDITIONAL_FRONTEND_URLS` bằng origin HTTPS thực tế của Static Site, không kèm đường dẫn. Giữ `FRONTEND_URL` cũ trong lúc kiểm tra. Lưu cấu hình và triển khai lại API.
5. Kiểm tra health, đăng nhập tài khoản thử, đọc/lưu dữ liệu, tải lại trang sâu, tải PDF/Excel, CSP, cập nhật PWA. Kiểm tra sau khoảng nghỉ để xác nhận API thức dậy trong nền trong khi giao diện mới vẫn mở được.
6. Khi chốt chuyển địa chỉ: có thể đổi `FRONTEND_URL` của API sang URL mới để các link khôi phục mật khẩu trỏ đúng nơi. `RENDER_EXTERNAL_URL` vẫn giúp origin cũ được nhận diện trong CORS.
7. Người dùng đăng nhập lại trên URL mới. PWA cài từ URL cũ không tự đổi origin: cần cài từ URL mới. Không chuyển token bằng query string, không chép mật khẩu/token giữa các URL.

### Thông số tạo Static Site thủ công

| Trường | Giá trị |
|---|---|
| Repository | `LNTienDat/student-life-hub` |
| Branch | `codex/student-life-hub-render` |
| Root Directory | Để trống, dùng gốc repo |
| Build Command | `cd front && npm ci --include=dev && npm run build` |
| Publish Directory | `front/dist` |
| `NODE_VERSION` | `24` |
| `SKIP_INSTALL_DEPS` | `true` |
| `VITE_API_URL` | `https://student-life-hub-inx4.onrender.com/api` |
| Rewrite | `/*` → `/index.html` |
| HTTP headers | Sao chép theo `render-static.yaml`, đặc biệt CSP, cache cho worker và asset |
| Auto deploy | Off, để cập nhật có kiểm soát như dịch vụ hiện tại |

## Giới hạn

Static Site giúp giao diện không phụ thuộc thời gian đánh thức API. Backend Free vẫn có thể nghỉ sau thời gian không có truy cập. Đây không phải cam kết máy chủ chạy liên tục hay không có độ trễ. Cấu hình dịch vụ hiện có vẫn được giữ để URL/PWA cũ dùng tiếp trong quá trình chuyển.

Gói miễn phí vẫn có hạn mức bandwidth/build. Không thêm cron ping hoặc dịch vụ trả phí. Email thật, Gemini và các phần tài chính còn thiếu là công việc riêng, chưa được triển khai trong thay đổi này.

## Minh chứng

- [Kiểm tra trình duyệt production trên khung điện thoại](../qa/2026-10-21-render-startup-browser.json): hai server local riêng để mô phỏng Static Site/API; health trả HTML khi đang khởi động, rồi JSON khi sẵn sàng; gửi đăng nhập đúng một lần; lỗi sau lưu không tạo trùng khi bấm kết nối lại; không có lỗi JS/CSP.
- [Ảnh thông báo chờ trên điện thoại](../qa/render-startup-mobile.png), dữ liệu tài khoản giả.
- [Xác thực schema Render](../qa/2026-10-21-render-blueprints.json).
- [Bộ backend mới nhất](../qa/2026-10-21-render-split-backend.json) và [kịch bản nghiệp vụ mở rộng](../qa/2026-10-21-render-split-api.json).
- Kiểm thử 12 ca mới cho single-flight, hết thời gian, offline, mất phản hồi, hủy yêu cầu, chỉ retry GET; 3 ca CORS cho origin chính xác và preflight Authorization.

Các bằng chứng local không chứng minh Static Site đã được tạo hoặc dịch vụ Render đã triển khai. Trạng thái online phải được ghi sau khi kiểm tra thực tế.
