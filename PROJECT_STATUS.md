# 📌 STUDENT LIFE HUB - TRẠNG THÁI DỰ ÁN

> **Online 30/10:** Đã push nhánh riêng tư và triển khai commit 3801331; backend/frontend cùng phiên bản, health tốt. Sao lưu Neon trước 9 migration mới. 8 nhóm API online, đăng nhập/đăng xuất/Quay lại và OCR bill mẫu đạt; sửa banner cập nhật PWA. CI GitHub thành công. Email online, AI thật và điện thoại thật còn cần nghiệm thu. [Báo cáo](docs/reports/ONLINE_RELEASE_2026_10_30.md). Các ghi chú “chỉ local” bên dưới là lịch sử trước đợt triển khai này.

> **Sao lưu và kiểm thử độc lập 28/10 — chỉ local:** Thêm Sao_Luu_CSDL.cmd và công cụ khôi phục sang CSDL thử mới, chặn ghi đè/tệp hỏng. 281 backend + 17 nhóm sao lưu/khôi phục đạt; bổ sung tình huống lỗi email đặt lại mật khẩu và AI. Không dùng dữ liệu thật, không gọi dịch vụ ngoài, chưa push/deploy. [Báo cáo](docs/reports/INDEPENDENT_WORK_2026_10_28.md).

> **Đã sửa 5 phát hiện 28/10 — chỉ local:** Chatbot áp dụng nghỉ/đổi lịch theo ngày; bộ lọc thu/chi không giữ danh mục sai; chặn ghi nhanh từ ngân sách danh mục đã ẩn; chia sẻ TKB lưu phạm vi học kỳ cố định; cập nhật hướng dẫn RAG. Migration local thêm shareHocKy, số bản ghi giữ nguyên. 271 backend + 74 frontend + 8 PWA/bản dựng và 23 nhóm trình duyệt/API/CSDL thử đạt. Link chia sẻ cũ cần bật lại. [Báo cáo và cách thử](docs/reports/AUDIT_FIXES_2026_10_28.md).

> **Rà soát tổng thể 28/10 — chưa sửa phát hiện:** 265 backend + 73 frontend + 8 PWA/bản dựng và lint/build đạt; 13 nhóm API/giao diện/CSDL thử bổ sung phát hiện 5 điểm ở chatbot lịch theo ngày, bộ lọc thu/chi, ngân sách danh mục đã ẩn, phạm vi chia sẻ TKB và hướng dẫn RAG. Không push/deploy, không dùng dữ liệu thật. [Kết quả và thứ tự sửa](docs/reports/FULL_AUDIT_2026_10_28.md).

> **Bố cục học kỳ và thêm việc 27/10 — chỉ local:** Hôm nay bỏ đổi/xóa học kỳ; Học tập/TKB dùng thanh học kỳ gọn và hộp đổi riêng. Form Thêm việc căn lại tên/ngày/giờ/ưu tiên, bỏ khoảng trống khi bật giờ. Lint/build, 73 frontend + 8 PWA/bản dựng và 8 nhóm trình duyệt đạt. [Minh chứng](docs/reports/COMPACT_SEMESTER_2026_10_27.md).

> **Điều hướng và bộ lọc 27/10 — chỉ local:** Đưa Mức quan trọng xuống dưới biểu mẫu deadline, ngay trước kết quả; thứ tự menu Hôm nay → Học tập → Thời khóa biểu → Deadline → Tài chính → Hồ sơ. Xác minh trang 404 đã có và nút quay về cho khách/người đăng nhập. Lint/build và 6 nhóm trình duyệt đạt. [Minh chứng](docs/reports/NAVIGATION_FILTER_2026_10_27.md).

> **Thêm nhanh và học kỳ 27/10 — chỉ local:** Thêm việc trên Hôm nay có đủ ba mức ưu tiên, giữ nháp và lưu thống nhất với Deadline. Thêm Xóa học kỳ: xem trước số lượng, nhập tên xác nhận, chặn phạm vi vừa thay đổi; giữ thu/chi, deadline, kỳ khác và tài khoản khác. 265 backend + 73 frontend + 8 PWA/bản dựng và 6 nhóm trình duyệt đạt. Hồ sơ mới chỉ đề xuất. [Phạm vi và minh chứng](docs/reports/SEMESTER_QUICK_2026_10_27.md).

> **Sửa theo kiểm thử 27/10 — chỉ local:** Cho sửa/xóa cả danh mục điền sẵn, luôn hiện danh mục đã ẩn và khôi phục; xử lý khi xóa hết. OCR đúng bill 225 000đ / 29-03-2019, ẩn chữ OCR; làm rõ sửa lịch lặp và đổi nút Xóa lịch hiện tại. Deadline điền sẵn ngày/năm, ưu tiên thấp xanh lá và đếm ngày. 260 backend + 73 frontend + 8 PWA/bản dựng và 6 nhóm trình duyệt mới đạt. **T21/T22 vẫn chưa được người dùng tự test.** [Chi tiết](docs/reports/USER_REVIEW_2026_10_27.md).

> **Hoàn thiện logic 26/10 — chỉ local:** Nút Quản lý danh mục luôn hiện, có đổi tên/xóa/khôi phục; sửa 8 phát hiện A1–A8; giữ nháp, gỡ ngân sách, thống nhất học kỳ và chuông 3 ngày/quá hạn. Thêm cảnh báo hóa đơn trùng và nghỉ/đổi lịch riêng một ngày có hoàn tác/kiểm tra trùng. Migration đã áp dụng local. 257 backend + 71 frontend + 8 PWA/bản dựng và 14 nhóm trình duyệt đạt. [Cách dùng, minh chứng và giới hạn](docs/reports/COMPLETION_2026_10_26.md).

> **Xóa danh mục và rà soát 26/10 — chỉ local:** Thêm icon thùng rác cho danh mục tự tạo, giữ lịch sử/ngân sách và khôi phục bằng cùng tên; migration daAn đã áp dụng local. 240 backend + 66 frontend + 8 PWA/bản dựng và 7 nhóm trình duyệt đạt. Ghi nhận 8 điểm còn thiếu/khác logic, chưa sửa, cùng giới hạn OCR/AI/email/thiết bị. [Báo cáo và thứ tự đề nghị](docs/reports/LOGIC_REVIEW_CATEGORY_DELETE_2026_10_26.md).

> **Danh mục và TKB 26/10 — chỉ local:** Đưa + Thêm danh mục xuống cuối danh sách; tách ghi chú bị đọc rác khỏi tên môn, đọc lại phòng bị bỏ sót; thêm Xóa lịch đang xem có xác nhận phạm vi/số buổi và xóa nguyên khối theo tài khoản. 235 backend + 66 frontend + 8 PWA/bản dựng và 10 nhóm trình duyệt đạt; thử OCR thật trên 3 ảnh. [Minh chứng và giới hạn](docs/reports/TIMETABLE_CATEGORY_CLEANUP_2026_10_26.md).

> **Danh mục riêng và quét hóa đơn 26/10 — chỉ local:** Chi tiêu mới có Ăn uống/Đi lại/Khác và nút + thêm danh mục theo tài khoản. Quét hóa đơn trên thiết bị, sửa trước khi xác nhận lưu; căn nhãn ưu tiên deadline bên phải. Migration local đã áp dụng, 222 backend + 64 frontend + 8 PWA/bản dựng và 13 nhóm trình duyệt đạt. [Cách dùng, minh chứng và giới hạn](docs/reports/FINANCE_RECEIPT_2026_10_26.md).

> **Học kỳ theo tài khoản và icon cài 26/10 — chỉ local:** Chọn học kỳ đang học một lần, tự điền Học tập/TKB/quét ảnh/thêm nhanh; tách xem kỳ cũ khỏi kỳ hiện tại, không bắt ngày kết thúc. Thay thanh mời cài bằng icon mở lại được. Đã thêm cột bằng migration local, 209 backend + 59 frontend + 8 PWA/bản dựng và 13 nhóm trình duyệt/API/CSDL thử đạt. [Cách dùng và minh chứng](docs/reports/SEMESTER_INSTALL_2026_10_26.md).

> **Deadline theo mức quan trọng 26/10 — chỉ local:** Chuông rút gọn thành “Deadline: tên việc” và ngày; danh sách xếp Khẩn cấp → Bình thường → Thấp, cùng mức theo hạn sớm. Thêm lọc mức cho cả danh sách và lịch. 59 frontend + 8 PWA/bản dựng, lint/build và 10 nhóm trình duyệt đạt. [Minh chứng/điều kiện thông báo](docs/reports/DEADLINE_PRIORITY_2026_10_26.md).

> **Gọn thông báo và khung lịch 26/10 — chỉ local:** Bỏ thanh cảnh báo lặp, hiển thị ngày trong chuông, bỏ nhập Excel/CSV ở TKB; đưa ô Thứ lên đầu mỗi khung thay vị trí Buổi cũ. 55 frontend + 8 PWA/bản dựng, lint/build và 11 nhóm trình duyệt/OCR thật đạt. [Minh chứng](docs/reports/UI_CLEANUP_2026_10_26.md).

> **Sửa nhập ảnh thời khóa biểu 26/10 — chỉ local:** Đọc riêng cột ngày, gợi ý sửa dấu tên môn, đối chiếu giờ và để trống giờ chưa rõ; bỏ dòng đánh số buổi. 55 frontend + 8 PWA/bản dựng, lint/build và 10 nhóm trình duyệt với OCR thật đạt. Ảnh mới còn một khoảng giờ bị đường đỏ che cần nhập tay; phòng và giảng viên vẫn cần đối chiếu. [Minh chứng và giới hạn](docs/reports/TIMETABLE_OCR_FIX_2026_10_26.md).

> **Hôm nay bỏ biểu đồ, cảnh báo 3 ngày 25/10 — chỉ local:** Bỏ biểu đồ và truy vấn GPA theo kỳ khỏi Hôm nay. Thêm icon chấm than đỏ có vòng sáng động cho deadline quá hạn hoặc đến hạn từ hôm nay đến hết ngày thứ ba tới theo giờ Việt Nam, tôn trọng giảm chuyển động. 51 frontend + 8 PWA/bản dựng, lint/build và 16 nhóm trình duyệt với API/CSDL thử đạt. [Minh chứng](docs/reports/DASHBOARD_ALERT_2026_10_25.md).

> **Hôm nay chỉ tóm tắt deadline 25/10 — chỉ local:** Theo yêu cầu mới, bỏ nút hoàn thành khỏi khối Deadline trên Hôm nay, chỉ giữ tên/hạn chót và liên kết mở Deadline để xử lý. 12 nhóm trình duyệt với API/CSDL thử đạt, 48 frontend + 8 PWA/bản dựng, lint/build đạt. [Minh chứng](docs/reports/TODAY_DEADLINE_SUMMARY_2026_10_25.md).

> **Deadline gọn và rõ thao tác 25/10 — chỉ local:** Thu gọn thẻ deadline (thẻ ngắn 70px ở 1440px), nút sửa/xóa nằm ngang; đổi nút Hôm nay thành “Đánh dấu xong”. 12 nhóm trình duyệt thực API/CSDL thử đạt, xác minh hoàn thành/hoàn tác, hai tab và F5 đồng bộ đúng. 48 frontend + 8 PWA/bản dựng, lint/build đạt. [Minh chứng](docs/reports/DEADLINE_COMPACT_2026_10_25.md).

> **Sửa HTTP 429 khi kiểm thử 25/10 — chỉ local:** Điều chỉnh quota chung, tách health check và giữ giới hạn đăng nhập/AI. 200 backend đạt; phép thử 614 yêu cầu gồm 12 lần tải lại Vite development không bị 429. Đã khởi động lại backend local, giữ phiên và dữ liệu người dùng. [Minh chứng](docs/reports/RATE_LIMIT_FIX_2026_10_25.md).

> **Giao diện/thiết bị 25/10 — chỉ local:** 60 tình huống Chrome với API/CSDL thử thật đạt, gồm 7 trang ở 320–1.280px, biểu mẫu hẹp, chat ở cửa sổ thấp, giao diện tối và thao tác cảm ứng mô phỏng. Sửa nút chat bị che, trả vị trí bàn phím, thông báo quá hẹp/bị lớp nền che, lịch có tên dài và giới hạn ô nhập. 48 logic frontend + 8 PWA/bản dựng, lint/build đạt. Chưa thử thiết bị vật lý hoặc AI/email thật; chưa push/deploy. [Minh chứng và cách chạy lại](docs/reports/DEVICE_CHECK_2026_10_25.md).

> **RAG 24/10 — chỉ local:** Đã thêm kho PDF có chữ/TXT/MD theo tài khoản, truy xuất BM25, nguồn trích dẫn và luồng Gemini có đồng ý gửi dữ liệu. Mặc định chỉ tìm/đọc tài liệu miễn phí; AI thật đang tắt do chưa xác nhận Billing. 193 backend + 48 frontend + 8 PWA/bản dựng = **249 bài tự động đạt**, 12 nhóm trình duyệt RAG đạt; Google được mô phỏng. [Hướng dẫn](docs/guides/RAG.md) · [Minh chứng và giới hạn](docs/reports/RAG_2026_10_24.md).

> **Tối ưu toàn dự án 24/10 — chỉ local:** [Thay đổi, minh chứng và giới hạn](docs/reports/OPTIMIZATION_2026_10_24.md). Sửa đồng bộ tài khoản giữa tab, bỏ phản hồi phiên cũ, chặn thao tác ghi lặp, cải thiện nhập điểm/CSV/lịch/thông báo, trì hoãn tải biểu đồ và giảm truy vấn nền. 147 backend + 48 frontend + 7 PWA + 1 kiểm tra bản dựng = **203 bài tự động đạt**; 23 nhóm thao tác trình duyệt đạt. npm audit: 11 → 0 cảnh báo ở ngày kiểm tra. Chưa push/deploy, chưa thử điện thoại vật lý hoặc AI/email thật.

> **Tài chính 24/10 — chỉ local:** [Phạm vi và cách thử](docs/guides/FINANCE_COMPLETE.md). Đã có sửa giao dịch; chọn tháng/năm dùng chung cho danh sách, tổng thu/chi, ngân sách, biểu đồ và Excel. Giữ nội dung khi lưu lỗi, bảo vệ bản nhập, chống gửi lặp và xử lý xóa hết trang/đổi tháng nhanh. 139 backend + 42 frontend + 7 PWA đạt; 12 nhóm thao tác trình duyệt với API thật và PostgreSQL thử riêng đạt. Chưa push/deploy; chưa thử trên điện thoại vật lý.

> **Chatbot 23/10 — chỉ local:** [Cấu hình và giới hạn](docs/guides/CHATBOT_AI.md). Tách tra cứu dữ liệu trực tiếp và tư vấn Gemini 3.5 Flash-Lite; có đồng ý gửi nội dung và tùy chọn gửi tóm tắt cá nhân. 131 kiểm thử backend (PostgreSQL thử riêng), 38 frontend, 7 PWA và 8 nhóm thao tác trình duyệt đạt. AI thật chưa được bật/chưa đo tốc độ vì chưa có khóa Free hợp lệ. Chưa push hoặc deploy.

> **Nhập thời khóa biểu từ ảnh 21/10 — chỉ local:** [Cách dùng và giới hạn](docs/guides/TIMETABLE_IMAGE_IMPORT.md). OCR chạy trong trình duyệt, có bản xem trước sửa được, bỏ chọn buổi nghỉ và chỉ lưu khi xác nhận. 103 backend + 35 frontend + 7 PWA đạt; đã thử ảnh thật và Vite dev. Chưa push GitHub hoặc triển khai Render. Hiện nhập lịch lặp hằng tuần theo học kỳ; chưa hỗ trợ biến động lịch riêng từng tuần.

> **Deadline rút gọn 21/10:** bỏ checklist, ghi chú và môn học khỏi giao diện; ba mức Thấp/Bình thường/Khẩn cấp; mặc định chọn ngày, bật Thêm giờ khi cần. Ngày không giờ hết hạn cuối ngày địa phương; sửa deadline cũ giữ giờ và không ghi đè các trường đã ẩn. Cả danh sách, lịch và thêm nhanh đã đồng bộ. Lint/build, 29 bài logic và 7 PWA đạt; [kiểm tra trình duyệt local](docs/qa/2026-10-21-simple-deadline.json). Bản này chưa triển khai online.

> **Giao diện gọn và nhập tiền 21/10:** trang Hôm nay đưa GPA/deadline/số dư lên đầu, hai khối lịch và công việc, mỗi thao tác nhanh xuất hiện một lần; bộ lọc học kỳ chỉ ở trang chi tiết. Ẩn Nhóm học khỏi menu (giữ mã và dữ liệu). Ô tiền thu/chi, ngân sách và ghi chi nhanh hiển thị `100 000` nhưng gửi số `100000`. Lint/build, 27 kiểm thử logic, 7 kiểm thử PWA và Chrome local với API giả đạt. [Minh chứng giao diện và payload](docs/qa/2026-10-21-compact-dashboard-money.json). Bản giao diện này chưa triển khai Render; người dùng đã xác nhận T3/T5 đạt ở bản trước `020306b`.

> **Chuẩn bị tách giao diện 21/10:** [Static Site và chờ máy chủ](docs/guides/STATIC_FRONTEND_SETUP.md) — đã bổ sung xử lý khởi động chậm, thử lại GET và origin cho frontend riêng; chưa kích hoạt dịch vụ Static Site trên Render.

> **Kiểm thử mới nhất 21/10:** [Bảng nghiệm thu chức năng](docs/reports/FUNCTION_ACCEPTANCE.md) — 118 bài tự động và 119 kịch bản mở rộng đạt trên môi trường thử riêng. Có giới hạn về UI, email/AI thật, thiết bị di động và bản online; chưa xác nhận hoàn thiện 100%.

> **Cập nhật lần cuối**: 2026-10-24

> **Sửa lỗi mới nhất:** [BUGFIX_REPORT.md](docs/reports/BUGFIX_REPORT.md) — 115 bài kiểm thử và 119 kịch bản mở rộng đạt trên database thử riêng; migration nhóm/chia sẻ đã bổ sung. Các nhận xét ngày 20/10 bên dưới là lịch sử trước đợt sửa. Chưa triển khai bản sửa này lên online.

> **Phần mới trong mã local:** nhóm học tập và chia sẻ thời khóa biểu; chưa nghiệm thu hoặc triển khai. Xem [PROJECT_REVIEW_UPDATE.md](docs/reports/PROJECT_REVIEW_UPDATE.md) về migration còn thiếu, kiểm thử và lỗi phân quyền đã tái hiện.

> **Nghiệm thu hiện tại:** theo [MODULE_COMPLETION.md](docs/planning/MODULE_COMPLETION.md), thực hiện tuần tự từng phần, bắt đầu với tài khoản và dữ liệu cá nhân. Checklist tính năng cũ bên dưới chỉ ghi nhận mã đã triển khai, không xác nhận đã nghiệm thu trên bản online. Kết quả rà soát UX: [UX_REVIEW.md](docs/reports/UX_REVIEW.md).

> Đợt cập nhật mới: xem [UPGRADE_NOTES.md](docs/reports/UPGRADE_NOTES.md). Đã xác minh 50 kiểm thử backend và 7 kiểm thử frontend; chưa xác nhận trực quan bằng trình duyệt. Checklist cũ dưới đây ghi nhận phạm vi đã triển khai, không chứng minh hệ thống hoàn thiện hoặc sẵn sàng production.
> **Mục tiêu**: Hệ thống Quản lý Học tập, Deadline & Tài chính cho Sinh viên.
> **Tech Stack**: Node.js (Express) + PostgreSQL (Prisma) | React 19 (Vite) + TailwindCSS.
> **Source Code**: `github.com/LNTienDat/student-life-hub`

---

## 📈 1. Tổng Kết Tiến Độ

- **Tiến độ tổng thể**: Các chức năng nền đã triển khai; còn bước xác nhận trực quan và vận hành thực tế.
- **Danh mục cũ**: 37 chức năng đã có triển khai; còn khoảng trống ở giao diện, cấu hình dịch vụ và nghiệm thu luồng đầy đủ.
- **Database**: 7 Model (NguoiDung, MonHoc, Diem, Deadline, GiaoDich, NganSach, ThoiKhoaBieu)
- **Backend API**: 41 Endpoints nghiệp vụ
- **Frontend**: 10 Trang giao diện chuẩn Responsive + Dark mode

---

## 🎯 2. Checklist 37 chức năng đã triển khai (lịch sử, chưa phải nghiệm thu)

### 🟢 Module 0: Tài khoản & Xác thực
- [x] CN1: Đăng ký tài khoản
- [x] CN2: Đăng nhập / Đăng xuất (JWT)
- [x] CN3: Khôi phục mật khẩu qua email
- [x] CN4: Xem / chỉnh sửa hồ sơ
- [x] CN5: Thay đổi mật khẩu

### 🔵 Module 1: Quản lý Học tập
- [x] CN6: CRUD môn học
- [x] CN7: Nhập điểm thành phần
- [x] CN8: Tính điểm tổng kết môn
- [x] CN9: Tính GPA tích lũy
- [x] CN10: Dự đoán điểm cần đạt
- [x] CN11: Cảnh báo môn nguy cơ trượt
- [x] CN12: Biểu đồ GPA theo kỳ
- [x] CN13: Xuất bảng điểm PDF

### 🟠 Module 2: Quản lý Deadline & Lịch học
- [x] CN14: CRUD deadline
- [x] CN15: List View deadline
- [x] CN16: Calendar View deadline
- [x] CN17: Đánh dấu trạng thái hoàn thành
- [x] CN18: Bộ lọc & sắp xếp deadline
- [x] CN19: Thông báo nhắc deadline (Banner)
- [x] CN20: Thời khóa biểu tuần

### 🟡 Module 3: Quản lý Tài chính
- [x] CN21: CRUD giao dịch thu/chi
- [x] CN22: Phân loại danh mục
- [x] CN23: Đặt hạn mức ngân sách tháng
- [x] CN24: Cảnh báo vượt chi tiêu
- [x] CN25: Biểu đồ tròn cơ cấu chi tiêu
- [x] CN26: Biểu đồ xu hướng theo tháng
- [x] CN27: Lịch sử giao dịch & tìm kiếm

### 🟣 Module 4: Dashboard Tổng hợp
- [x] CN28: Trang chủ thống kê
- [x] CN29: Danh sách cảnh báo khẩn cấp
- [x] CN30: Mini-charts trên Dashboard

### 🔴 Module 5: Hệ thống Thông báo
- [x] CN31: In-app notification (biểu tượng chuông)
- [x] CN32: Email nhắc deadline (Cron Job tự động)
- [x] CN33: Email cảnh báo vượt ngân sách (Cron Job tự động)

### 🟤 Module 6: Tính năng Nâng cao
- [x] CN34: Chatbot hỏi đáp nhanh (Gemini AI)
- [x] CN35: Dark / Light Mode
- [x] CN36: Responsive Design
- [x] CN37: Xuất báo cáo tổng kết tài chính Excel

---

## Xác minh và công việc tiếp theo

Theo dõi kết quả thực tế trong PROJECT_GAPS.md; không quy đổi checklist tính năng thành mức hoàn thiện 100%.


## Cập nhật local 30/10/2026: mật khẩu và deadline
Nút xem/ẩn mật khẩu rõ hơn, giao diện sáng/tối ở trang tài khoản, email đặt lại chỉ còn một liên kết. Deadline hoàn thành thu gọn; tùy chọn tự chuyển vào Đã xóa sau 24 giờ, có khôi phục. Đã sao lưu và cập nhật CSDL local, số bản ghi không đổi. Kiểm thử: 303 backend + 86 frontend + 8 PWA + 10 trình duyệt đạt; lint/build đạt. Chưa push/deploy/áp dụng migration trên Neon. Chi tiết: docs/reports/AUTH_DEADLINE_2026_10_30.md.
