# Hoàn thiện LifeHub — 28/10/2026

## Đã thực hiện trong đợt này
- RAG: chuẩn hóa cách hỏi tiếng Việt và viết tắt (TKB/lịch học, hạn nộp/deadline, điểm trung bình/GPA, bill/hóa đơn). Giữ trích đoạn gốc.
- RAG: bác dẫn nguồn giả kể cả chữ thường; bác số liệu và đường dẫn không xuất hiện trong đoạn được dẫn. Nếu không xác minh được, trở về trích đoạn để người dùng đọc.
- OCR: giới hạn một lượt đọc ảnh tối đa 180 giây, có hủy tác vụ; giải phóng bộ nhận diện và tránh lỗi đóng worker che lỗi gốc. Áp dụng cả hóa đơn và TKB.
- Email: hỗ trợ Resend qua HTTPS cho môi trường Render; giữ SMTP cho local; giới hạn thời gian chờ, che lỗi nhà cung cấp, không tự gửi lại khi mất phản hồi. Chặn nhanh SMTP phổ biến khi chạy Render.
- Email đặt lại mật khẩu: kiểm tra giao thức liên kết và escape nội dung HTML.
- Phiên bản: frontend build có version.json, backend có /api/version. scripts/check-online.mjs đọc trạng thái công khai để so hai bản và kiểm tra CSDL.
- Đã nạp backend mới vào local và xác nhận /api/health trả ok. Vite 5173 vẫn mở được.

## Kết quả kiểm thử
- Backend: **296/296**, 37 bộ kiểm thử; PostgreSQL thử riêng cổng 55461.
- Frontend: **78/78**.
- PWA/build: **8/8**, lint đạt.
- OCR thật trong Chrome: hóa đơn người dùng nhận số tiền **225000**, ngày **2019-03-29**; TKB người dùng nhận **6 buổi**, đúng ngày và giờ trên ảnh.
- Hóa đơn khoảng 3 giây, TKB khoảng 7,5 giây trên máy hiện tại; đây là phép đo một mẫu/lượt, không phải cam kết tốc độ mọi thiết bị.
- Hủy trước khi quét đã kiểm tra; timeout/cancellation có kiểm thử tự động.
- Kết quả backend: [JSON](../qa/2026-10-28-completion-backend.json).
- Kết quả OCR: [JSON](../qa/2026-10-28-completion-ocr.json).
- CSDL thử đã dừng; dữ liệu người dùng không được dùng trong kiểm thử.

## Các bước chưa thể xác nhận bằng kiểm thử local
1. **AI thật:** khóa Gemini có trong local nhưng AI đang tắt, chưa xác nhận Billing/Free Tier. Không gọi mô hình thật để giữ yêu cầu ưu tiên miễn phí. Chưa có đo chất lượng/tốc độ AI thật.
2. **Email thật:** chưa có khóa Resend; SMTP đã cấu hình nhưng không gửi thư thật trong đợt này. Cần địa chỉ gửi được phép và hộp thư thử do người dùng kiểm soát để nghiệm thu. Xem [hướng dẫn](../guides/EMAIL_DELIVERY.md).
3. **Online:** chưa đẩy GitHub hoặc deploy. Probe frontend version.json nhận HTML, backend chưa phản hồi trong 20 giây; không suy ra máy chủ hỏng vì có thể đang ngủ. Bản online chưa có dấu phiên bản mới. Cần deploy mã và migration Neon sau sao lưu.
4. **Điện thoại:** kiểm thử PWA tự động đạt; chưa xác nhận camera, cài đặt, bộ nhớ và tốc độ trên điện thoại thật.
5. **OCR:** mẫu TKB còn nhầm vài chữ mã phòng như I/1/l, “máy/móy”. Các ảnh nghiêng, mờ và ánh sáng khác chưa đủ mẫu đánh giá. Người dùng luôn kiểm tra trước khi lưu; hệ thống không tự lưu.
6. **PDF scan:** phần RAG vẫn cần PDF có lớp chữ hoặc văn bản TXT; chưa hỗ trợ OCR PDF scan.
7. **Vận hành:** Render Free có thể ngủ nên không cam kết lịch email chạy đúng giờ; sao lưu local đã nghiệm thu ở đợt trước, backup Neon tự động chưa cấu hình.

## Quy trình cập nhật online
- Sao lưu Neon trước khi migration; kiểm tra khả năng khôi phục bản sao.
- Xem nhánh/Auto Deploy trước khi đẩy mã.
- Triển khai backend có migration 20261028000000_scoped_timetable_sharing, rồi frontend cùng commit.
- Cấu hình FRONTEND_URL và ADDITIONAL_FRONTEND_URLS đúng URL frontend.
- Nếu bật email HTTPS: cấu hình EMAIL_PROVIDER=resend, RESEND_API_KEY và EMAIL_FROM ở backend.
- Chạy node scripts/check-online.mjs. Cần cả health ok và hai commit trùng nhau.
- Thử đăng nhập, chia sẻ TKB, RAG và quên mật khẩu bằng dữ liệu thử trên online.

Các kiểm thử đạt chứng minh các kịch bản nêu trên. Không đồng nghĩa tất cả tình huống thực tế đều đã được nghiệm thu.
