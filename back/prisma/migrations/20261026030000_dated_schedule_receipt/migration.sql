ALTER TABLE "GiaoDich" ADD COLUMN "anhHoaDonHash" TEXT;
CREATE INDEX "GiaoDich_idNguoiDung_anhHoaDonHash_idx" ON "GiaoDich"("idNguoiDung","anhHoaDonHash");
CREATE TABLE "DieuChinhLich" (
"id" SERIAL PRIMARY KEY, "idNguoiDung" INTEGER NOT NULL, "idBuoiHoc" INTEGER NOT NULL,
"ngayGoc" TEXT NOT NULL, "loai" TEXT NOT NULL CHECK ("loai" IN ('nghi','doi')),
"ngayMoi" TEXT, "gioBatDau" TEXT, "gioKetThuc" TEXT, "phongHoc" TEXT, "giangVien" TEXT,
CONSTRAINT "DieuChinhLich_idNguoiDung_fkey" FOREIGN KEY ("idNguoiDung") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE,
CONSTRAINT "DieuChinhLich_idBuoiHoc_fkey" FOREIGN KEY ("idBuoiHoc") REFERENCES "ThoiKhoaBieu"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX "DieuChinhLich_idBuoiHoc_ngayGoc_key" ON "DieuChinhLich"("idBuoiHoc","ngayGoc");
CREATE INDEX "DieuChinhLich_idNguoiDung_ngayGoc_idx" ON "DieuChinhLich"("idNguoiDung","ngayGoc");
CREATE INDEX "DieuChinhLich_idNguoiDung_ngayMoi_idx" ON "DieuChinhLich"("idNguoiDung","ngayMoi");
