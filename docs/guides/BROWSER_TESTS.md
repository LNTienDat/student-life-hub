# Kiểm thử trình duyệt LifeHub
Cập nhật 29/10/2026.

## Phạm vi
Bộ Playwright trong front/e2e chạy với frontend, Express API và PostgreSQL thật ở môi trường thử:
- Đăng ký, đăng nhập, tải lại, đăng xuất và nút Quay lại.
- Lưu, đổi và xóa học kỳ trống.
- Tổng trọng số 110% bị chặn; 100% tính GPA 9.20.
- Lịch trùng giờ bị chặn; giờ nối tiếp được lưu.
- Hoàn thành/mở lại deadline đồng bộ sang Hôm nay.
- Thêm/sửa/xóa giao dịch, kiểm tra số tiền trong CSDL.
- Giả lập riêng bộ OCR để kiểm tra lỗi tải lượt đọc phụ không làm mất bản nháp.
- Căn lề trên sáu trang chính ở 1440px và 390px.

OCR trong bài test lỗi là mô phỏng có chủ đích. Đây không phải phép đo độ chính xác OCR; ảnh thật đã có bằng chứng riêng ở docs/qa/2026-10-28-pc-feedback-ocr.json.
390px là mô phỏng kích thước, không thay cho nghiệm thu điện thoại vật lý.

## Chạy local
1. Chuẩn bị PostgreSQL và CSDL riêng có tên kết thúc bằng _test.
2. Cài dependency trong cả back và front bằng npm ci.
3. Thiết lập DATABASE_URL cho đúng CSDL thử. Chạy prisma generate và prisma migrate deploy từ thư mục back.
4. Từ front, chạy npx playwright install chromium, rồi npm run test:e2e.
5. Nếu dùng Chrome đã cài, đặt PLAYWRIGHT_CHANNEL=chrome trước khi chạy.

Cấu hình từ chối URL CSDL từ xa và tên CSDL không phải _test. Không tái sử dụng server đang chạy. Backend test ở 5063, frontend test ở 5193; bản local sử dụng 5000/5173 được giữ riêng.

Test tạo tài khoản giả ngẫu nhiên và xóa đúng tài khoản đó sau từng bài. AI và email bị tắt trong server test. Không dùng tài khoản thật, khóa Gemini hoặc Resend thật.

## Bằng chứng và CI
- HTML: front/playwright-report/index.html
- JSON: front/test-results/results.json
- Ảnh/trace khi lỗi: front/test-results/
- Các file kết quả được loại khỏi Git; CI upload artifact trong 7 ngày.
- Workflow chạy npm ci, cài Chromium, rồi npm run test:e2e sau các bài test API.
- Workflow mới chỉ có hiệu lực trên GitHub khi mã đã được đẩy vào nhánh/PR được cấu hình. Chạy local thành công không chứng minh job GitHub đã chạy.

## Tài liệu công cụ
- https://playwright.dev/docs/test-webserver
- https://playwright.dev/docs/ci-intro
