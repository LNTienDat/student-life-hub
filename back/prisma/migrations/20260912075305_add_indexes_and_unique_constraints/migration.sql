/*
  Warnings:

  - A unique constraint covering the columns `[idNguoiDung,danhMuc,thang,nam]` on the table `NganSach` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Deadline_idMonHoc_idx" ON "Deadline"("idMonHoc");

-- CreateIndex
CREATE INDEX "Deadline_idNguoiDung_trangThai_hanChot_idx" ON "Deadline"("idNguoiDung", "trangThai", "hanChot");

-- CreateIndex
CREATE INDEX "MonHoc_idNguoiDung_hocKy_idx" ON "MonHoc"("idNguoiDung", "hocKy");

-- CreateIndex
CREATE UNIQUE INDEX "NganSach_idNguoiDung_danhMuc_thang_nam_key" ON "NganSach"("idNguoiDung", "danhMuc", "thang", "nam");

-- CreateIndex
CREATE INDEX "ThoiKhoaBieu_idNguoiDung_thu_idx" ON "ThoiKhoaBieu"("idNguoiDung", "thu");
