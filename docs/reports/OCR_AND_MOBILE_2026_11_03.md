# OCR và giao diện điện thoại — 03/11/2026

## Đã sửa

- Hóa đơn không có dòng tổng: cộng thành tiền các món trong bảng có cấu trúc, đối chiếu các lần OCR, hiển thị là tổng tạm để người dùng kiểm tra trước khi lưu. Không cộng hai lần cả đơn giá và thành tiền; bảng thiếu tiền, sai số lượng, có thuế hoặc giảm giá không được tự chốt tổng.
- TKB: thêm lượt đọc hàng thứ theo khối khi đọc chữ rời không thành công; đọc đối chiếu cả cột và kiểm tra giờ mâu thuẫn trước khi điền.
- Khung deadline ở Hôm nay: chuyển liên kết mở sang icon ở tiêu đề, trạng thái trống nằm trên một dòng.
- Nút Thêm buổi học rộng toàn hàng trên điện thoại; Xóa lịch và Chia sẻ chia đều hàng phía trên.
- Chatbot: loại deadline đã xóa khỏi cả danh sách và số lượng trả lời.

## Kết quả kiểm tra local

- 90 kiểm thử frontend đạt; 10 kiểm thử chatbot đạt; lint và build đạt.
- Chrome 390×844: kiểm thử bố cục đạt, dùng cơ sở dữ liệu thử riêng.
- Ảnh HACODE của người dùng: 40 000 đồng, 05/04/2019, Ăn uống, NHÀ HÀNG HACODE. Có cảnh báo tổng tạm từ các món.
- Ảnh TKB ba buổi: đúng 3 môn, Thứ 2 và hai buổi Thứ 6. Xử lý ảnh 07:00–11:15, UML 13:00–17:15. Giờ Python mâu thuẫn giữa các lượt đọc nên để trống yêu cầu xác nhận.
- Kiểm tra lại ảnh cũ: hóa đơn Hoàng Phúc vẫn 54 000 đồng; ảnh TKB sáu buổi vẫn nhận sáu buổi. Một số giờ cần xác nhận và dấu tên riêng còn sai.
- Kết quả OCR thực chạy được lưu trong thư mục improvement-backups/ocr-20261103 (bị loại khỏi Git).

## Chatbot hiện hỗ trợ

- Xem dữ liệu: GPA tích lũy, môn có nguy cơ; deadline quá hạn/sắp tới; thu chi và ngân sách tháng hiện tại; lịch hôm nay/ngày mai có điều chỉnh.
- Hỏi tài liệu: tìm đoạn liên quan và dẫn nguồn tài liệu được phép truy cập.
- Hỏi AI: gợi ý cách học, kế hoạch và chi tiêu. Chưa bật trên online vì chưa xác nhận cấu hình miễn phí; không gọi AI trả phí trong lần sửa này.

## Giới hạn

OCR không bảo đảm chính xác tuyệt đối. Không tự lưu giao dịch hoặc lịch sau nhận diện. Phải xem lại ảnh, tiền, ngày, môn và giờ trước khi lưu. Kiểm thử điện thoại ở trên là mô phỏng Chrome; người dùng cần thử lại máy thật sau cập nhật.
