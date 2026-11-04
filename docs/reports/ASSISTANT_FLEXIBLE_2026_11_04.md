# Trợ lý hiểu thời gian và lập kế hoạch

## Thay đổi
- Tra cứu lịch hôm qua, hôm nay, ngày mai, ngày kia và tuần trước/này/sau theo giờ Việt Nam, kể cả giao tuần; áp dụng nghỉ/đổi lịch và học kỳ đang học.
- Lịch quá khứ được ghi rõ là lịch dự kiến theo dữ liệu hiện có, không phải xác nhận điểm danh.
- Khi AI sẵn sàng và người dùng đồng ý gửi câu hỏi cùng dữ liệu cá nhân, câu hỏi dữ liệu cũng có thể được AI diễn giải bằng ngôn ngữ tự nhiên. Không còn luôn chặn ở câu trả lời theo mẫu.
- Ngữ cảnh AI có lịch ba tuần, GPA, deadline và thu/chi hiện tại; kế hoạch phải tránh chồng lịch, nêu giả định khi thiếu thông tin, không tự lưu công việc.
- Nếu AI lỗi/hết hạn mức ở câu hỏi dữ liệu đã nhận diện, trả kết quả tra cứu trực tiếp; không gọi lại dịch vụ tự động.
- Ngày cụ thể không nhận diện bằng quy tắc được chuyển sang tài liệu/AI, không âm thầm trả lịch hôm nay.

## Nghiệm thu còn cần
Chưa gọi Gemini thật: chủ dự án cần kiểm tra đúng dự án chứa API key là Free Tier và chưa liên kết Billing. Không thể xác minh gói thanh toán chỉ bằng nội dung khóa API.
Chưa bật AI hoặc thay đổi khóa/cấu hình Render trong lần sửa này.

Sau khi cấu hình: bật hai lựa chọn trong Tùy chọn trợ lý; thử “Hôm qua học gì?”, “Tuần sau học những môn nào?”, “Lập kế hoạch ôn trong tuần, tôi rảnh sau 19 giờ”, rồi hỏi nối tiếp “Rút còn 30 phút mỗi tối được không?”. Đối chiếu ngày, môn và thời gian với Lịch học; kiểm tra kế hoạch chỉ là đề xuất.

## Kiểm tra Gemini thật ngày 04/11/2026
- Người dùng cung cấp ảnh Google AI Studio hiển thị Free tier; khóa local khớp hậu tố khóa trong ảnh. Không thay đổi Billing.
- Đã bật CHATBOT_AI_ENABLED ở .env local (tệp được bỏ qua bởi Git).
- Thử bằng lịch và câu hỏi giả: kế hoạch ôn 19:00–20:00 trả lời trong 2,7 giây; chia phiên, có nghỉ, chưa tự lưu.
- Một lần thử ban đầu AI tính nhầm ngày hôm qua. Đã thêm mốc hôm qua/hôm nay/ngày mai do máy chủ tính theo giờ Việt Nam vào chỉ dẫn. Thử lại trả đúng 03/11/2026 và câu nối tiếp ngày mai 05/11/2026.
- 49 kiểm thử tự động liên quan đạt; lint và build frontend đạt. Kiểm thử có mô phỏng nhà cung cấp không thay thế nghiệm thu thực tế; AI vẫn có thể trả sai và cần người dùng đối chiếu.
