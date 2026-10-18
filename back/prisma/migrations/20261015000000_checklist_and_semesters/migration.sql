ALTER TABLE "Deadline" ADD COLUMN "checklist" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "ThoiKhoaBieu" ADD COLUMN "hocKy" TEXT NOT NULL DEFAULT '';
CREATE INDEX "ThoiKhoaBieu_idNguoiDung_hocKy_idx" ON "ThoiKhoaBieu"("idNguoiDung", "hocKy");
