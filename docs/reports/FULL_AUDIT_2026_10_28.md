# Rà soát toàn dự án — 28/10/2026

> A1-A5: [Da sua va kiem tra lai](AUDIT_FIXES_2026_10_28.md). Noi dung ben duoi la ket qua truoc khi sua.

Phạm vi: bản local tại D:\EDU\Do_An_2_SLH. Đây là lượt rà soát, chưa sửa 5 phát hiện dưới đây; không commit/push/deploy, không thay cấu hình GitHub/Render và không ghi dữ liệu người dùng thật.

## Kết quả chính

- 265 kiểm thử backend / 34 bộ đạt; 73 kiểm thử logic frontend và 8 kiểm tra PWA/bản dựng đạt; lint và build đạt.
- npm audit: backend production dependencies và toàn bộ frontend đều trả 0 cảnh báo trong lần kiểm tra này. Đây là kết quả đối chiếu phụ thuộc, không chứng minh ứng dụng không có lỗi bảo mật.
- 13 nhóm kiểm tra bổ sung với API thật ở 5058, UI Vite ở 5188, PostgreSQL riêng ở 55458 và hai tài khoản giả. Đã tái hiện 5 điểm cần sửa.
- Đã kiểm tra đăng ký/đăng nhập, chặn dữ liệu tài khoản khác, trọng số 110%/100%, GPA 9.20, lịch trùng/tiếp nối, bật/tắt chia sẻ, thu/chi, ngân sách đã ẩn danh mục, xuất PDF/Excel, kho tài liệu có nguồn, hoàn thành/hoàn tác deadline, Hôm nay và đăng xuất/bấm Quay lại.
- Bảy trang dashboard/mon-hoc/thoi-khoa-bieu/deadline/tai-chinh/ho-so/tai-lieu không cuộn ngang toàn trang với dữ liệu thử ở 1440/390/320px. Không có lỗi JavaScript trang trong lượt cuối.
- Chế độ Hỏi AI thật bị tắt; trả trạng thái chưa sẵn sàng đúng. Không gọi dịch vụ Google hoặc gửi email thật.
- Tình huống nghi vấn hộp chia sẻ sau lỗi tải đã được kiểm chứng: đóng/mở lại phục hồi được. Không đưa thành lỗi. Kịch bản mô phỏng hai lượt effect của React StrictMode ở development.
- Một lượt chạy lại chạm quota đăng ký/đăng nhập 429 do dùng cùng IP nhiều lần. Khởi động lại riêng API thử rồi chạy lượt cuối đạt; không sửa hạn mức hay khởi động lại máy chủ người dùng.

## Những điểm cần sửa

| Mã | Ưu tiên | Điểm xác nhận | Ảnh hưởng |
|---|---|---|---|
| A4 | P2 — làm trước | Chatbot lịch học chưa áp dụng nghỉ/đổi theo ngày | Trả lời lịch không khớp TKB và Hôm nay |
| A2 | P2 | Đổi loại thu/chi giữ bộ lọc danh mục không tương thích | Hiện “Tất cả danh mục” nhưng truy vấn vẫn lọc danh mục cũ, bỏ sót kết quả |
| A3 | P2 | Ghi chi từ ngân sách danh mục đã ẩn tự đổi danh mục | Người dùng có thể lưu khoản chi vào nhầm mục |
| A1 | P2 | Chia sẻ TKB không có phạm vi học kỳ rõ ràng | Link công khai gộp cả lịch kỳ cũ và kỳ hiện tại |
| A5 | P2 | Hướng dẫn tích hợp cho RAG đã lỗi thời | Tìm tài liệu/AI có thể dùng hướng dẫn trái tính năng thật |

### A4 — Chatbot chưa dùng lịch thực tế theo ngày

Tạo “Buổi đã báo nghỉ” 17:00–18:00 cho ngày 28/10/2026, học kỳ đang học HK2 2026-2027. Lưu điều chỉnh Nghỉ hôm đó. API TKB tuần đã bỏ buổi này, nhưng hỏi “Hôm nay học gì?” vẫn trả “Hôm nay: 1 buổi học — 17:00–18:00: Buổi đã báo nghỉ”.

Nguyên nhân: back/src/modules/chatbot/chatbot.service.js:70–74 đọc lịch lặp trực tiếp theo thứ; không dùng projectWeek/loadWeek và điều chỉnh ngày. Phần này cũng lấy tất cả học kỳ (có nói rõ trong câu trả lời), khác phạm vi lịch Hôm nay đang dùng.

Đề nghị dùng chung nguồn lịch theo ngày và học kỳ đang học như DashboardToday, xử lý hôm nay/ngày mai cả khi đổi tuần. Kiểm tra cả buổi nghỉ, buổi đổi giờ, buổi chuyển sang tuần khác và kỳ cũ.

### A2 — Bộ lọc thu/chi có giá trị ngầm

Có Thu nhập 100 000đ và Chi tiêu Ăn uống 20 000đ trong tháng 10/2026. Chọn danh mục Ăn uống, rồi đổi Loại thành Thu nhập. Ô danh mục hiển thị Tất cả danh mục, nhưng yêu cầu thực tế gửi loai=thu&danhMuc=an_uong và trả 0 dòng, dù có 1 khoản thu.

Nguyên nhân: front/src/pages/TaiChinh.jsx:187 chỉ cập nhật trường đang đổi; TransactionTable dựng lại danh sách lựa chọn nhưng không xóa mã danh mục cũ không thuộc loại mới.

Đề nghị khi đổi loại, giữ danh mục nếu còn hợp lệ, ngược lại đưa về Tất cả danh mục; đồng bộ giá trị nhìn thấy với truy vấn.

Minh chứng: [ảnh bộ lọc](../qa/full-audit-incompatible-category-filter.png).

### A3 — Ghi chi từ ngân sách danh mục đã ẩn bị đổi ngầm

Tạo Mua sách, đặt ngân sách 50 000đ, sau đó xóa danh mục khỏi lựa chọn mới. Ngân sách cũ được giữ đúng. Bấm vào ngân sách “Mua sách” để ghi khoản chi: biểu mẫu mở nhưng tự chọn Ăn uống.

Nguyên nhân: BudgetSection.jsx:101 mở biểu mẫu với mã Mua sách đã ẩn; CategorySelect.jsx:14 tự thay mã không còn trong lựa chọn mới bằng mục đầu tiên.

Đề nghị với ngân sách danh mục đã ẩn, yêu cầu khôi phục/chọn lại rõ ràng hoặc vô hiệu hóa thao tác ghi chi và nêu lý do; không tự đổi sang mục khác.

Minh chứng: [ảnh biểu mẫu](../qa/full-audit-archived-budget-category.png).

### A1 — Link công khai gộp lịch nhiều học kỳ

Tài khoản đang học HK2 2026-2027, có một lịch HK1 và hai lịch HK2. API riêng lọc HK2 đúng, nhưng bật chia sẻ và mở link tuần vẫn thấy cả HK1/HK2. Hai kỳ cùng giờ cũng có thể xuất hiện chồng nhau. Hộp chia sẻ chưa cho chọn hoặc giải thích rõ phạm vi tất cả học kỳ.

Nguyên nhân: back/src/modules/thoikhoabieu/thoikhoabieu.controller.js:232 truy vấn tất cả lịch người sở hữu, không lọc học kỳ.

Đề nghị mặc định chia sẻ kỳ đang học hoặc kỳ đang xem và ghi rõ phạm vi trước khi bật. Nếu cần chia sẻ tất cả thì phải là lựa chọn rõ ràng. Tắt chia sẻ hiện chặn link cũ đúng.

### A5 — Hướng dẫn cho RAG chưa theo bản hiện tại

Nguồn mặc định “Hướng dẫn LifeHub”, trang 3, vẫn ghi “Lịch hiện lặp theo tuần trong học kỳ, chưa có ngoại lệ theo từng ngày.” Trong khi ứng dụng đã có Nghỉ/Đổi riêng một ngày.

Đã hỏi chế độ tài liệu về nhập TKB từ ảnh và nhận đúng đoạn hướng dẫn lỗi thời này từ API. Đây là lỗi nội dung nguồn có sẵn, không phải bằng chứng AI bịa câu trả lời.

Nguồn: back/src/modules/rag/lifehub-guide.js:7. Đề nghị cập nhật hướng dẫn tính năng hiện tại, ngày phiên bản và thêm kiểm tra tránh nội dung hướng dẫn đi ngược chức năng.

## Còn chờ kiểm chứng hoặc hoàn thiện nghiệm thu

- AI thật: chưa gọi Gemini; chưa xác nhận Free Tier/Billing. Hiện phần truy xuất tài liệu có nguồn hoạt động, nhưng không coi toàn bộ luồng RAG với AI thật đã nghiệm thu.
- Email: chưa kiểm chứng gửi/nhận liên kết đặt lại mật khẩu và nhắc hạn qua nhà cung cấp thật. Cron đang tắt trong bản thử; không đánh dấu email hoạt động chỉ vì unit test đạt.
- Android/iPhone và bản PWA cài trên máy: các chiều rộng/cảm ứng mô phỏng và kiểm tra PWA không thay thế kiểm thử trên thiết bị vật lý, bàn phím thật và camera.
- OCR: các kiểm thử parser/logic đạt; lượt này không mở thêm ảnh mới để chứng minh khả năng đọc mọi hóa đơn/TKB. Các minh chứng OCR thật trước đây vẫn có phạm vi riêng.
- T21/T22 trong checklist người dùng vẫn chưa được người dùng xác nhận, không tự đánh dấu hoàn tất vì chạy tự động.
- Nhiều thay đổi local còn chưa commit/push. Cần đối chiếu bản triển khai với bản đã kiểm tra rồi mới nghiệm thu online. Quyền Render đọc repo Private ở lần deploy tiếp theo chưa xác minh trong lượt này.
- Git không theo dõi .env thật trong danh sách tệp đang được quản lý; đã thấy .env.example. Không quét lịch sử Git để chứng minh chưa từng có khóa bị lộ.
- Hồ sơ bổ sung, xóa tài khoản, sao lưu/khôi phục toàn bộ chưa có nghiệm thu trong đợt này; đây là phần cân nhắc theo phạm vi đồ án, không tự coi cần bổ sung thêm mọi tính năng.

## Minh chứng

- [Backend](../qa/2026-10-28-full-audit-backend.json).
- [13 nhóm luồng thật và 5 phát hiện](../qa/2026-10-28-full-audit-browser.json).
- [Ảnh mobile tối](../qa/full-audit-documents-mobile-dark.png).
- Log lint, test, npm audit và kịch bản nằm ở improvement-backups/full-audit-20261028.
- API/Vite/PG thử được dừng sau kiểm tra; CSDL thử được xóa có kiểm tra đường dẫn. Không dừng dịch vụ local chính và không xóa dữ liệu thật.

Thứ tự đề nghị: A4 → A2 → A3 → A1 → A5. Sửa xong kiểm thử lại từng tình huống; không thêm tính năng mới trước khi xử lý các lỗi này.
