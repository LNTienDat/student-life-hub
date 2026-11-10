# Triển khai và nghiệm thu online — 30/10/2026

## Kết quả

Đã đẩy mã lên GitHub riêng tư và triển khai LifeHub trên Render. Frontend và backend đều trả phiên bản `38013315ea232daf6edcf9721a4cd16434e183cc`; `/api/health` trả HTTP 200, `status: ok`. Không đổi sang gói trả phí, không gọi Gemini, không gửi email thật trong lượt này.

- Website: https://student-life-hub-web.onrender.com
- API: https://student-life-hub-inx4.onrender.com/api
- Nhánh: `codex/student-life-hub-render`, repo `LNTienDat/student-life-hub` vẫn private.
- PR #1 vẫn là bản nháp, chưa hợp nhất vào main.
- Commit tổng hợp: `97ca05c`; bản vá cập nhật PWA cuối: `3801331`.
- CI cuối: https://github.com/LNTienDat/student-life-hub/actions/runs/41043029367 — thành công cả Frontend Build Check và API and PostgreSQL Tests.

## Sao lưu và cơ sở dữ liệu

Trước khi triển khai đã tạo nhánh Neon `backup-before-release-20261030`, gồm dữ liệu và cấu trúc từ production. ID `br-long-brook-a1qtku3r`, không tự xóa. Không đổi địa chỉ kết nối production. Khi backend khởi động, Prisma tìm thấy 15 migration và áp dụng thành công 9 migration còn thiếu; lần triển khai bản vá cuối không thêm migration.

Phương án khôi phục: giữ nhánh sao lưu, kiểm tra dữ liệu trên nhánh/CSDL thử riêng trước; chỉ chuyển kết nối production sau khi đối chiếu và có quyết định khôi phục. Không thử ghi đè production trong lượt nghiệm thu. Khôi phục về bản sao cũ có thể bỏ những thay đổi phát sinh sau thời điểm sao lưu; chưa diễn tập cắt chuyển production.

## Triển khai Render

| Thành phần | Kết quả |
|---|---|
| Backend `student-life-hub` | Live, deploy `dep-dbi7athsrm7s73df7u50`, 1m22s, commit 3801331 |
| Frontend `student-life-hub-web` | Đã phục vụ commit 3801331 qua `/version.json` |
| Biến địa chỉ web | FRONTEND_URL và ADDITIONAL_FRONTEND_URLS trỏ web static mới |
| Auto Deploy | Frontend: On Commit; backend: Off, triển khai thủ công đúng commit |
| AI tạo câu trả lời | CHATBOT_AI_ENABLED=false; chưa xác nhận Free Tier/Billing |
| Email online | Chưa có cấu hình nhà cung cấp gửi thư trên backend Render |

Frontend tự triển khai khi push nhánh; việc không bấm Deploy không đảm bảo bản web giữ nguyên. Sau lần cập nhật sau cần triển khai backend tương ứng rồi chạy lại công cụ đối chiếu phiên bản. Cảnh báo Needs attention ở dự án MERN khác không được thay đổi trong lượt này.

## Kiểm chứng trực tiếp

Dùng một tài khoản tổng hợp có tên “Nghiệm thu online 30-10”, email thuộc example.invalid. Không dùng tài khoản hoặc dữ liệu thật để thử xóa.

| Nội dung | Bằng chứng/kết quả |
|---|---|
| Đăng ký, đăng nhập, hồ sơ | API online thành công; đăng nhập bằng giao diện thành công |
| Phiên và đăng xuất | Mở lại dashboard giữ phiên; đăng xuất rồi Quay lại vẫn ở login, không hiện dữ liệu riêng |
| Học kỳ đã lưu | API áp dụng HK1 → HK2 → HK1, hai kỳ vẫn được giữ |
| TKB | API chặn Toán 07:00–09:00 / Lý 08:00–10:00 với HTTP 409; nhận Lý 09:00–10:00 |
| Điểm | API chặn 40%+70% với HTTP 400; nhận 40%+60%, GPA 9.20; dashboard hiển thị 9.20 |
| Thu chi | Thu 100.000đ − chi 20.000đ = 80.000đ; API và giao diện đúng |
| Deadline | Hoàn thành tạo timestamp; mở lại xóa timestamp; tùy chọn dọn sau 24h lưu được và đã trả về tắt |
| Quyền truy cập/CORS | Hồ sơ thiếu phiên bị từ chối 401; preflight từ đúng frontend được phép |
| OCR online | Bill mẫu VINH NGUYEN RES nhận 225.000đ, 29/03/2019, Ăn uống; chỉ xem bản nháp rồi hủy, không lưu giao dịch |
| Cập nhật PWA | Phát hiện banner cũ không biến mất; đã sửa, thêm kiểm thử hồi quy; bấm cập nhật trên web mới làm banner biến mất |

8 nhóm API online đạt. Giao diện kiểm tra trên trình duyệt tích hợp với khung nhìn hẹp; không thay cho điện thoại thật. 2 hóa đơn cà phê/xăng ở U9 của quy trình chưa được quét lại online trong lượt này. Lần chọn file OCR qua công cụ mất khoảng 6 phút tính cả thao tác trình duyệt và nhận diện; chưa đo riêng thời gian OCR, chưa kết luận hiệu năng trên máy người dùng.

Đã xóa đúng 6 dữ liệu gốc tự tạo (2 lịch, 1 môn kèm điểm, 2 giao dịch, 1 deadline). Giữ một tài khoản nghiệm thu cùng học kỳ thử; không có API xóa tài khoản. Không đụng dữ liệu tài khoản thật.

## Minh chứng lưu tại máy

- `improvement-backups/release-20261030/online-version.json`: commit trùng, health tốt.
- `improvement-backups/release-20261030/online-smoke.json`: 8 nhóm API.
- `improvement-backups/release-20261030/cleanup.json`: dọn dữ liệu giả.
- `improvement-backups/release-20261030/neon-backup.png`: nhánh sao lưu.
- `improvement-backups/release-20261030/backend-live-final.png`: bản cuối Live.
- `improvement-backups/release-20261030/online-dashboard.png`: dashboard bản cuối.
- `improvement-backups/release-20261030/online-receipt.png`: nhận diện bill mẫu online.

Thư mục này bị Git bỏ qua; tệp phiên thử bên trong chứa thông tin đăng nhập tổng hợp, không đưa vào báo cáo nộp hoặc GitHub.

## Chưa nghiệm thu và bước tiếp theo

1. **Điện thoại thật:** theo phần E trong USER_ACCEPTANCE_2026_10_29.md, dùng URL static mới. Cần thử camera, bàn phím, chọn ảnh/ngày, cài PWA, mở lại và mất mạng.
2. **Email online:** phần C người dùng đã xác nhận trên local; Render chưa có nhà cung cấp HTTPS. Xem EMAIL_DELIVERY.md; cấu hình xong cần thử nhận thư thật tại đúng URL online. Không dùng kết quả local để đánh dấu email online đạt.
3. **AI thật:** vẫn tắt; chưa kiểm chứng câu trả lời Gemini và chi phí/hạn mức. RAG tìm nguồn và OCR trên thiết bị không chứng minh AI tạo câu trả lời đã nghiệm thu.
4. **Render Free:** API có thể ngủ, lần truy cập sau chậm 50 giây hoặc hơn. Static site giúp giao diện mở trước nhưng không loại bỏ thời gian khởi động API. Chưa kiểm thử tải lớn hoặc vận hành liên tục.

Người dùng có thể mở web mới, tải lại bằng Ctrl+F5 hoặc bấm Cập nhật và tải lại nếu được đề nghị. Không cần triển khai lại. Bản PWA cài từ URL backend cũ cần chuyển sang cài từ URL static mới; dữ liệu vẫn gắn tài khoản/CSDL online.
