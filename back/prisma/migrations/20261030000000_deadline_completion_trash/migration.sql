ALTER TABLE "NguoiDung" ADD COLUMN "tuDongXoaDeadline" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Deadline" ADD COLUMN "hoanThanhLuc" TIMESTAMP(3), ADD COLUMN "xoaLuc" TIMESTAMP(3);
-- Existing completed tasks receive a full 24-hour window; cleanup remains opt-in.
UPDATE "Deadline" SET "hoanThanhLuc" = CURRENT_TIMESTAMP WHERE "trangThai" = 'hoan_thanh';
