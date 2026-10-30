# Cập nhật LifeHub từ local lên online

Nhánh Render đang dùng: `codex/student-life-hub-render`. Website: https://student-life-hub-web.onrender.com. Cập nhật mã không tự chuyển tài khoản/dữ liệu local lên Neon.

## 1. Kiểm tra trên máy

Mở thư mục `D:\EDU\Do_An_2_SLH` bằng VS Code. Kiểm tra chức năng vừa sửa; chạy lint/build và kiểm thử phù hợp. Không chạy bộ kiểm thử ghi/xóa trên CSDL thật.

## 2. Đưa mã lên GitHub

Trong VS Code, mở Source Control (Ctrl+Shift+G):

1. Kiểm tra đang ở nhánh `codex/student-life-hub-render`.
2. Xem từng tệp thay đổi; chỉ chọn Stage cho mã và tài liệu cần cập nhật. Không đưa `.env`, khóa, bản sao CSDL, ảnh riêng hoặc thư mục improvement-backups lên GitHub.
3. Nhập mô tả thay đổi rồi Commit.
4. Bấm Push hoặc Sync Changes. Nếu báo xung đột, giải quyết trước khi triển khai; không force push.
5. Mở GitHub, ghi lại mã commit mới và kiểm tra Actions. Chờ các bài kiểm tra đạt.

Frontend hiện bật Auto Deploy On Commit, nên có thể bắt đầu triển khai ngay khi push, không cần bấm Deploy. Backend hiện tắt Auto Deploy, cần bước 3.

## 3. Cập nhật trên Render

1. Mở dashboard Render, chọn dịch vụ **student-life-hub** (backend Node).
2. Chọn **Manual Deploy → Deploy latest commit**. Muốn chắc đúng mã đã kiểm tra, chọn **Deploy a specific commit** và chọn commit đó.
3. Chờ **Deploy succeeded | Live**. Nếu thất bại, xem log; đừng chuyển sang bước kiểm thử như đã thành công.
4. Mở **student-life-hub-web** (frontend Static), kiểm tra cũng Live ở cùng commit. Nếu chưa tự cập nhật, dùng Manual Deploy cho đúng commit.
5. Không cần tạo dịch vụ mới, đổi DATABASE_URL, đổi gói hoặc gỡ ứng dụng mỗi lần cập nhật. Khi có thay đổi cấu trúc CSDL, sao lưu trước và xem kỹ migration; mã khởi động backend hiện tự chạy Prisma migrate deploy.

## 4. Đối chiếu và sử dụng

Ở thư mục gốc dự án chạy:

```powershell
node scripts/check-online.mjs
```

Ba kiểm tra cần `ok: true`; `sameRelease: true` xác nhận frontend/backend cùng phiên bản. Render Free có thể mất khoảng một phút hoặc hơn để thức dậy; nếu vừa ngủ, chờ máy chủ sẵn sàng rồi kiểm tra lại.

Mở web trên máy tính/điện thoại, tải lại hoặc chọn **Cập nhật và tải lại** khi xuất hiện. Thử chức năng vừa thay đổi bằng dữ liệu giả. Giữ nguyên tài khoản online; không phải đăng ký hoặc cài lại. Nếu bản đã cài dùng URL backend cũ, chuyển sang URL static mới ở đầu tài liệu.
