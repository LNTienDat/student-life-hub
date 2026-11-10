# Danh mục tài chính và quét hóa đơn — 26/10/2026

Bản này chỉ chạy local, chưa commit, push hoặc triển khai Render.

## Thay đổi

- Tài khoản mới chỉ có danh mục chi Ăn uống, Đi lại, Khác. Thu nhập bắt đầu với Khác. Nút + cạnh danh mục cho phép tạo danh mục theo loại thu/chi, lưu riêng theo tài khoản.
- Tên trùng không phân biệt hoa/thường hoặc dấu được dùng lại. Dữ liệu và danh mục cũ đã dùng được giữ. Không cần tạo lại giao dịch hoặc ngân sách.
- Danh mục riêng dùng được khi thêm/sửa giao dịch, ghi chi nhanh, lọc theo danh mục, đặt ngân sách, thông báo vượt ngân sách, ngữ cảnh chatbot và xuất Excel. Excel hiển thị tên danh mục.
- Quét hóa đơn: chọn ảnh/chụp ảnh → đọc trên thiết bị bằng Tesseract → gợi ý danh mục, tổng tiền, ngày và mô tả → sửa trong biểu mẫu giao dịch → bấm Lưu giao dịch.
- Ảnh và chữ OCR không được gửi lên API. Chỉ các trường giao dịch đã xác nhận được lưu. Hủy quét, hủy bản nháp hoặc đổi tài khoản không tạo giao dịch.
- Ưu tiên deadline chuyển sang bên phải trước nút sửa/xóa, có chiều rộng thống nhất; trên màn hình hẹp chuyển xuống hàng thao tác bên phải.

## Cơ sở dữ liệu

Thêm bảng DanhMucTaiChinh bằng migration 20261026010000_finance_categories, đã áp dụng local và tạo Prisma Client. Không sửa/xóa giao dịch, ngân sách hoặc tài khoản hiện có. GET/POST /api/finance/danh-muc yêu cầu đăng nhập, lấy chủ sở hữu từ phiên. Tối đa 50 danh mục riêng/tài khoản; tên 1–50 ký tự. Giao dịch và ngân sách chỉ chấp nhận mã danh mục thuộc tài khoản hoặc mã mặc định hợp lệ.

## Minh chứng kiểm thử

- 222 kiểm thử backend thuộc 29 bộ đạt trên PostgreSQL thử riêng; gồm danh mục, phân quyền hai tài khoản, tạo đồng thời, ngân sách, thông báo và nội dung Excel. Kết quả: ../qa/2026-10-26-finance-receipt-backend.json.
- 64 kiểm thử frontend và 8 kiểm thử PWA/bản dựng đạt; lint và build đạt.
- 13 nhóm thử trình duyệt Chrome với bản dựng thật, API/Prisma/PostgreSQL thử riêng và Tesseract thật đạt: ../qa/2026-10-26-finance-receipt-browser.json.
- Ảnh hóa đơn tạo để thử có tổng 20.000đ, tiền khách đưa 50.000đ, tiền thừa 30.000đ: chọn đúng 20.000đ, Ăn uống và ngày; sửa thành 25.000đ rồi lưu đúng một lần.
- Hóa đơn thiếu tổng/ngày để trống và chặn lưu; hủy OCR không phát sinh bản nháp hoặc ghi dữ liệu muộn.
- Kiểm tra giao diện tối ở 320/390px, hộp thêm danh mục và căn nhãn deadline ở desktop/mobile; không tràn ngang hoặc lỗi JavaScript.
- Migration được áp dụng trên CSDL local; toàn bộ phép thử ghi dữ liệu dùng tài khoản/CSDL thử riêng.

Ảnh minh chứng: receipt-review-desktop.png, finance-categories-mobile.png, finance-add-category-mobile.png, deadline-priority-aligned-desktop.png và deadline-priority-aligned-mobile.png trong docs/qa.

## Giới hạn và cách thử

Nhấn F5 ở http://127.0.0.1:5173/tai-chinh. Tại Thêm giao dịch, bấm + cạnh Danh mục. Tại Quét hóa đơn, chọn/chụp ảnh, kiểm tra lại toàn bộ trường rồi Lưu giao dịch.

OCR là gợi ý, không đảm bảo mọi hóa đơn. Ảnh mờ, nghiêng, nhiều cột hoặc bố cục lạ có thể đọc sai; tổng tiền không rõ, nhiều tổng mâu thuẫn, ngày không rõ và ngoại tệ sẽ cần nhập tay. Hiện hỗ trợ JPG, PNG, WebP tối đa 10 MB, một giao dịch chi cho mỗi ảnh. Không tách từng mặt hàng, không tự quy đổi ngoại tệ, không đồng bộ ảnh lên máy chủ. Thử nghiệm camera mới xác nhận thuộc tính chụp ảnh trên giao diện; chưa thử camera điện thoại vật lý hoặc hiệu năng trên máy yếu. Tìm kiếm chữ giao dịch vẫn theo mô tả/mã; để tìm chính xác danh mục riêng dùng bộ lọc Danh mục.

Trước khi dùng online cần triển khai cả backend và frontend kèm migration; chưa thực hiện trong đợt này.
