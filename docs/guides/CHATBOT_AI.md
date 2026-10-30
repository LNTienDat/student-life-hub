# Trợ lý LifeHub: tra cứu dữ liệu và tư vấn AI

Bản local cập nhật 24/10/2026. Chưa đẩy GitHub, chưa triển khai Render.

## Có thể làm gì?

- **Xem dữ liệu:** đọc GPA tạm tính từ các điểm đã nhập, việc quá hạn và 7 ngày tới, thu/chi tháng hiện tại, ngân sách tháng, lịch hôm nay/ngày mai. Không gọi mô hình bên ngoài. Dữ liệu được đọc mới cho từng câu hỏi, giới hạn theo tài khoản đăng nhập.
- **Hỏi AI:** Gemini gợi ý cách học, ôn thi, lập kế hoạch và quản lý chi tiêu cơ bản. Có thể chọn gửi kèm bản tóm tắt dữ liệu cá nhân. Mặc định không gửi kèm.
- Nhãn “Dữ liệu LifeHub” và “Gợi ý từ AI” giúp phân biệt hai loại kết quả.
- Không tự tạo, sửa hay xóa dữ liệu. Không truy cập tài khoản khác, Internet hay dữ liệu trường học bên ngoài.
- Phạm vi hiện tại: tất cả học kỳ đã nhập, lịch học lặp hằng tuần. Không tự nhận biết nghỉ học hay lịch theo ngày nếu chưa có dữ liệu tương ứng.

Hai chế độ trên dùng dữ liệu trực tiếp hoặc bản tóm tắt (context injection). Bản 24/10 bổ sung chế độ Hỏi tài liệu: kho riêng, truy xuất BM25 và RAG có dẫn nguồn. Xem [RAG.md](RAG.md) để biết cách dùng và giới hạn; AI thật vẫn chưa được nghiệm thu, mặc định đang tắt.

## Bật Gemini miễn phí ở local

1. Vào [Google AI Studio](https://aistudio.google.com/api-keys), tạo/chọn dự án có trạng thái **Free**, chưa bật Billing. Không cần gửi khóa vào cuộc trò chuyện.
2. Điền trong **back/.env** trên máy của bạn:

~~~dotenv
GEMINI_API_KEY=khóa_thật_của_bạn
GEMINI_MODEL=gemini-3.5-flash-lite
CHATBOT_AI_ENABLED=true
~~~

3. Khởi động lại backend, mở lại chatbot, chọn **Hỏi AI** và đồng ý gửi nội dung tới Google.
4. Hỏi “Gợi ý 3 cách ôn thi hiệu quả”. Muốn tư vấn theo dữ liệu của mình thì chọn thêm ô gửi kèm tóm tắt.
5. Kiểm tra AI Studio để xem mức sử dụng và hạn mức của đúng dự án.

**Tên model không tự bảo đảm miễn phí.** Phí phụ thuộc dự án gắn với khóa. Biến CHATBOT_AI_ENABLED chỉ bật/tắt tính năng, không kiểm tra được Billing của Google. Ứng dụng không tự chuyển sang model hay dịch vụ trả phí khi hết hạn mức. Không bật Billing nếu chỉ muốn dùng Free.

Theo [bảng giá Google](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite) kiểm tra ngày 23/10/2026, model này có Free Tier với hạn mức; nội dung trên Free Tier có thể được Google dùng để cải thiện sản phẩm. Nên demo bằng tài khoản thử và dữ liệu giả. Khóa chỉ đặt ở backend, không đặt trong front/.env, biến VITE_*, mã nguồn hay ảnh chụp.

## Vì sao chọn model này và xử lý chậm?

[Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) được Google mô tả là model độ trễ thấp. Bản tích hợp dùng mức suy luận MINIMAL, câu trả lời ngắn tối đa 500 token, chỉ giữ tối đa 3 cặp hỏi/đáp AI gần nhất trong 8.000 ký tự. Không gửi lời chào, lỗi hoặc lịch sử tra cứu dữ liệu sang Google.

Các câu hỏi số liệu phổ biến được xử lý trực tiếp, không mất lượt API AI. Phần tư vấn chờ tối đa 15 giây tại máy chủ cho mỗi lần gọi, không tự gọi lại. Có thể dừng chờ hoặc tự thử lại. Dừng chờ ở trình duyệt không thu hồi được yêu cầu đã gửi tới Google.

Render Free vẫn có thể mất thời gian khởi động sau khi ngủ. Đổi model không khắc phục thời gian chờ máy chủ hoặc mạng. Chưa có phép đo tốc độ AI thật vì chưa cấu hình khóa Free hợp lệ; kiểm thử provider dùng giả lập, không được xem là minh chứng chất lượng hay tốc độ mô hình.

## Trạng thái và xử lý lỗi

- AI chưa được bật/khóa mẫu: Xem dữ liệu vẫn hoạt động; phần AI báo cần cấu hình.
- Khóa sai, thiếu quyền hoặc tên model không tồn tại: thông báo kiểm tra cấu hình, không lộ nội dung lỗi gốc.
- Hết hạn mức: thông báo thử lại sau, không tự nâng cấp.
- AI chậm, kết quả rỗng hoặc bị chặn: báo cụ thể, không giả làm câu trả lời thành công.
- Không đọc được CSDL: không gọi AI với ngữ cảnh giả là tài khoản trống.
- Đổi chế độ, đổi lựa chọn gửi dữ liệu hoặc bắt đầu cuộc trò chuyện mới sẽ xóa hội thoại đang hiển thị. Lịch sử không lưu vào CSDL hay localStorage. Đổi tài khoản làm mới cửa sổ trợ lý.

API: GET /api/chatbot/trang-thai và POST /api/chatbot/hoi-dap đều yêu cầu đăng nhập. POST nhận tinNhan, cheDo (du_lieu/ai/tai_lieu), lichSu, dongYGuiAI, dungDuLieuCaNhan. ID tài khoản luôn lấy từ JWT. Giới hạn chung: 20 câu/5 phút cho mỗi IP; gói Free của Google có hạn mức riêng.

## Khi triển khai sau này

Chỉ sau khi kiểm thử local và muốn cập nhật online: đẩy mã nguồn, cập nhật backend và Static Site; cấu hình ba biến Gemini ở **Web Service backend**, không cấu hình ở Static Site. Tuyệt đối không đưa khóa vào Git. Kiểm tra nhánh và Auto Deploy trước khi đẩy vì Render có thể tự triển khai.

## Kiểm thử

Bộ kiểm thử gồm unit cho phạm vi dữ liệu theo giờ Việt Nam, tính tiền chính xác, ngữ cảnh theo tài khoản, consent, giới hạn hội thoại; lỗi provider, timeout, hạn mức và output rỗng; kiểm thử API với PostgreSQL riêng và hai tài khoản dùng dữ liệu giả. Kiểm thử giao diện trên trình duyệt dùng API mô phỏng để kiểm tra thao tác, không gọi Google thật.
