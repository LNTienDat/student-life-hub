# Rà soát toàn bộ dự án và phần mới — 20/10/2026

## Kết luận

Mã local có hai tính năng mới: nhóm học tập và chia sẻ thời khóa biểu. Chúng đã có giao diện, API, schema và tám bài kiểm thử bổ sung, nhưng **chưa đủ điều kiện triển khai/nghiệm thu**: thiếu migration, lint không đạt và có lỗi phân quyền đã tái hiện.

Mốc đối chiếu là commit `a21746f67e4c953b65eaed98297393283b3c868a`. Các phần mới vẫn nằm ở thay đổi chưa commit tại thời điểm rà soát. Báo cáo này không xác nhận website online đã có chúng và không đưa các thay đổi lên Render.

## Những gì mới trong mã

| Phần | Đã có triển khai | Còn thiếu trong luồng hiện tại |
| --- | --- | --- |
| Nhóm học tập | Trang danh sách/chi tiết; tạo nhóm, mã mời sáu ký tự, tham gia/rời nhóm, chủ nhóm xóa thành viên hoặc giải tán | API có sửa nhóm/sửa deadline nhưng các trang hiện tại chưa cung cấp thao tác tương ứng; chưa có chuyển quyền chủ nhóm |
| Deadline nhóm | Tạo/xóa deadline, tiến độ riêng của mỗi người, ghi chú ở API, tổng hợp tỷ lệ hoàn thành | Chưa tích hợp deadline nhóm vào Hôm nay, chuông thông báo hay ngữ cảnh chatbot; cần làm rõ tiến độ của thành viên đã rời nhóm |
| Chia sẻ thời khóa biểu | Bật/tắt chia sẻ, sao chép liên kết, trang công khai không cần đăng nhập | API trả lịch của mọi học kỳ; chưa có chọn học kỳ chia sẻ hoặc thay liên kết cũ bằng liên kết mới |
| Cơ sở dữ liệu | Bốn model mới: NhomHocTap, ThanhVienNhom, DeadlineNhom, TienDoDeadlineNhom; hai trường shareToken/shareEnabled | Chưa có migration tạo bảng/cột tương ứng |
| Kiểm thử và tài liệu | Tám bài integration nhóm/chia sẻ; báo cáo kiểm tra, checklist nghiệm thu và công cụ kiểm tra mở rộng từ đợt trước | Bài nhóm mới dọn dữ liệu quá rộng; các ca thành công chưa bao phủ lỗi phân quyền được tìm thấy ở lượt này |

Chưa thấy mã RAG/truy xuất kho tài liệu được bổ sung. Chatbot vẫn là hướng ghép dữ liệu cá nhân vào ngữ cảnh gọi mô hình. Cấu hình hosting vẫn gộp frontend/backend trên Render Free; chưa có thay đổi tách giao diện thành Static Site để cải thiện màn hình chờ.

## Kết quả chạy kiểm tra hiện tại

- Backend: **14 suites, 88 bài đạt**, gồm tám bài mới. Chạy trên PostgreSQL 18 thử nghiệm riêng ở loopback:55439, database `slh_review_20261020`.
- Frontend: **10 bài logic và 7 bài PWA đạt**; build production thành công.
- ESLint: **12 lỗi, 2 cảnh báo** tại ChiTietNhom.jsx, ChiaSeTKB.jsx, NhomHocTap.jsx, ThoiKhoaBieu.jsx và TimetableShareModal.jsx. CI có bước lint nên hiện chưa qua được cổng này.
- Kiểm tra triển khai database mới chỉ bằng năm migration hiện có: có các bảng cũ, **không có bốn bảng nhóm và không có cột chia sẻ**. Điều này được kiểm tra trước khi đồng bộ schema thử.
- Để đánh giá chức năng, chỉ trên database tạm đã xác nhận rỗng, dùng `prisma db push --skip-generate --accept-data-loss` tạo schema mới rồi chạy bộ kiểm thử. Kết quả 88 bài đạt **không chứng minh quy trình triển khai bằng migrations đã đúng**.
- Không dùng database thật hoặc Neon. Không gửi thư/AI, không bật chia sẻ lịch thật của người dùng. Dữ liệu kiểm tra bổ sung được tạo riêng và dọn theo đúng ID tạo ra.

Minh chứng: [kết quả tổng hợp](../qa/2026-10-20-review-summary.json), [kịch bản kiểm tra bổ sung](../qa/2026-10-20-new-features-results.json). Công cụ tái hiện và đầu ra thô nằm trong thư mục được Git bỏ qua `improvement-backups/functional-audit-20261020`.

## Lỗi và rủi ro cần xử lý

### Ưu tiên trước khi đưa phần mới lên online

1. **Thiếu migration, có thể làm hỏng cả luồng tài khoản khi triển khai mã mới.** Prisma Client mới đọc các cột chia sẻ trong model người dùng, trong khi quy trình khởi chạy chỉ áp dụng migration cũ. Cần migration tương ứng và chạy thử từ database rỗng qua đúng quy trình triển khai. Không dùng db push vào database thật để bỏ qua bước này.
2. **Ghi tiến độ chéo nhóm.** Trong `capNhatTienDo`, API chỉ kiểm tra người gọi thuộc nhóm trên URL, rồi upsert tiến độ theo ID deadline mà không kiểm tra deadline thuộc nhóm đó. Đã thử bằng hai nhóm và một thành viên riêng: gửi URL nhóm A kèm ID deadline của nhóm B trả 200 và tạo bản ghi tiến độ trong B. Cần ràng buộc deadline với đúng nhóm và kiểm tra thành viên trước khi ghi.
3. **Thành viên đã bị xóa vẫn sửa/xóa deadline cũ.** Hai API sửa/xóa chỉ kiểm tra người tạo hoặc chủ nhóm. Sau khi chủ nhóm xóa thành viên, người đó vẫn sửa và xóa được deadline họ đã tạo (đều trả 200). Cần xác nhận tư cách thành viên hiện tại trước khi xét vai trò.
4. **Bộ test nhóm xóa dữ liệu không giới hạn.** `nhom.api.test.js` gọi deleteMany không có where cho tiến độ, deadline nhóm, thành viên và nhóm trong cả beforeAll/afterAll. Nếu chạy với DATABASE_URL dữ liệu thật, nó sẽ xóa toàn bộ dữ liệu nhóm ở database đó. Lượt kiểm tra này chỉ chạy trên database thử riêng. Cần chốt database thử và giới hạn dọn dữ liệu theo ID tạo ra.

### Chức năng/giao diện cần hoàn thiện

5. **Tỷ lệ hoàn thành vượt 100%.** Hai người hoàn thành, sau đó một người bị xóa khỏi nhóm: API vẫn trả hai dòng hoàn thành, trong khi UI chia cho một thành viên hiện tại, cho kết quả **200%**. Đã tái hiện bằng API và đối chiếu công thức trong ChiTietNhom.jsx. Cần thống nhất phạm vi thành viên dùng cho tử số và mẫu số.
6. **Trang công khai vẫn có nút sửa/xóa.** ChiaSeTKB.jsx dùng TimetableGrid/TimetableMobile nhưng không truyền onSua/onXoa; hai component luôn vẽ các nút và gọi trực tiếp callback đó. Qua đọc mã: bấm nút sẽ gọi hàm undefined, không đạt trải nghiệm “chỉ xem”. Chưa thử trực tiếp trong trình duyệt ở lượt này; API ghi vẫn có yêu cầu đăng nhập, không kết luận người ngoài sửa được lịch.
7. **Thông tin xác nhận xóa lịch bị sai cấu trúc trở lại.** ThoiKhoaBieu.jsx truyền itemInfo.title/subtitle nhưng ConfirmModal đọc label/value/extra, nên tên/giờ/phòng không xuất hiện đúng trong vùng thông tin. Đây là hồi quy của lỗi từng sửa ở đợt UX trước.
8. **403 phân quyền bị xử lý thành đăng xuất.** Nhóm trả 403 đúng khi người dùng không phải thành viên; interceptor dùng chung lại xóa token và chuyển tới login với mọi 403. Lỗi phiên có từ trước nhưng luồng nhóm làm tình huống này xuất hiện thường xuyên hơn. Nên giữ phiên hợp lệ và hiển thị “không có quyền truy cập nhóm”.
9. **Modal và dữ liệu tải còn thiếu xử lý.** Modal chia sẻ chưa có focus trap/Escape/khóa cuộn như ConfirmModal; lỗi tải trạng thái chỉ ghi console. Các trang nhóm thiếu cơ chế chống phản hồi cũ ghi đè khi đổi ID nhanh; thao tác sao chép chưa chờ kết quả clipboard nên có thể báo thành công dù sao chép thất bại. Đây là nhận xét từ mã, chưa được kiểm tra UI trực tiếp trong đợt này.

Quan sát thiết kế: tắt rồi bật chia sẻ dùng lại token cũ; liên kết đã gửi trước đây hoạt động lại. Nếu muốn thu hồi hẳn liên kết cũ, cần thao tác đổi token và mô tả rõ cho người dùng. Không đánh đồng việc token được dùng lại với việc tắt chia sẻ thất bại: ca tắt chia sẻ đã trả 404 đúng.

## So với lỗi cũ

Không có thay đổi trong các controller tài khoản/điểm/tài chính hoặc AuthContext/Profile so với mốc đã kiểm tra. Vì vậy chưa có bản sửa tương ứng cho các lỗi khôi phục mật khẩu, tổng trọng số, ranh giới tháng theo UTC và đồng bộ phiên đã ghi trong [FUNCTIONAL_AUDIT.md](FUNCTIONAL_AUDIT.md). Lượt này không chạy lại toàn bộ 119 ca cũ vào schema mới và không quy đổi các bài happy path đang đạt thành việc các lỗi đó đã hết.

## Thứ tự xử lý đề xuất

Giữ mục tiêu làm chắc từng phần. Trước mắt không triển khai nhóm/chia sẻ khi còn lỗi phân quyền và thiếu migration. Hoàn thiện tài khoản/khôi phục theo checklist đang có; sau đó nghiệm thu riêng nhóm/chia sẻ với luồng chủ nhóm, thành viên, người ngoài, thành viên bị xóa, nhiều học kỳ và liên kết bị thu hồi. AI/RAG là một đợt sau, không trộn vào việc sửa lỗi nền.

Đợt này chỉ rà soát, chạy thử và lưu minh chứng trong dự án; không sửa mã nghiệp vụ, không commit/push/deploy và không hoàn tác thay đổi mới của người dùng.
