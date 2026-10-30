DROP INDEX "DanhMucTaiChinh_idNguoiDung_ma_key";
CREATE UNIQUE INDEX "DanhMucTaiChinh_idNguoiDung_loai_ma_key" ON "DanhMucTaiChinh"("idNguoiDung", "loai", "ma");
