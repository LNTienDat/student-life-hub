# Đưa bản sửa điện thoại/OCR lên online — 30/10/2026

Đã push và triển khai commit `d4fd6c69da0ab7d9fd61864461d3cfa87cc032ae` trên nhánh `codex/student-life-hub-render`. Repo vẫn private. Không thêm biến môi trường, không đổi gói dịch vụ, không thay schema hoặc nhập dữ liệu local lên online.

- Backend Render: Deploy succeeded | Live, thời gian 1m33s.
- Frontend tự triển khai theo commit; `/version.json` và backend `/api/version` trả cùng d4fd6c6.
- `/api/health`: HTTP200, status ok.
- CI GitHub run 41071131328: Frontend Build Check và API and PostgreSQL Tests đều thành công.
- Thử trực tiếp API online bằng tài khoản nghiệm thu tổng hợp: tạo deadline → xóa tay → có trong Đã xóa và không nằm danh sách hoạt động → khôi phục → trạng thái chưa hoàn thành → chuyển lại thùng rác. Giữ một deadline thử trong thùng rác của tài khoản tổng hợp; không sửa dữ liệu tài khoản thật.

Phạm vi bản này: điều hướng dưới trên điện thoại, bố cục nút/ô tháng thu chi, trục biểu đồ trống, xóa deadline có thể khôi phục, nhãn Tổng: trên bill và đọc riêng tiêu đề thứ của TKB. OCR thực hai ảnh được kiểm tra ở local trước khi triển khai; không đánh dấu là đã quét lại trên điện thoại thật sau triển khai. TKB vẫn cần đối chiếu hai buổi chưa rõ giờ và một số dấu trong phòng/giảng viên.

Minh chứng local (Git bỏ qua): `improvement-backups/mobile-release-20261030/version.json`, `online-trash.json`, `render-live.png`.

Người dùng mở https://student-life-hub-web.onrender.com trên điện thoại, tải lại hoặc chọn Cập nhật và tải lại khi được đề nghị. Không cần đăng ký hoặc cài lại ứng dụng đang dùng URL này. Thử thanh điều hướng dưới, ô tháng và ba nút tài chính; xóa một deadline giả rồi khôi phục; quét lại bill Hoàng Phúc (54.000đ, 18/02/2019, Ăn uống) và ảnh TKB. Nếu còn thấy menu cũ, đóng toàn bộ cửa sổ LifeHub rồi mở lại.
