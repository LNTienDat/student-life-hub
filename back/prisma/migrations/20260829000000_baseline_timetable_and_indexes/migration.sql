-- AlterTable
ALTER TABLE "NguoiDung" ADD COLUMN     "matKhauDoiLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "resetPasswordExpiry" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;

-- CreateTable
CREATE TABLE "ThoiKhoaBieu" (
    "id" SERIAL NOT NULL,
    "idNguoiDung" INTEGER NOT NULL,
    "tenMon" TEXT NOT NULL,
    "thu" INTEGER NOT NULL,
    "gioBatDau" TEXT NOT NULL,
    "gioKetThuc" TEXT NOT NULL,
    "phongHoc" TEXT,
    "giangVien" TEXT,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThoiKhoaBieu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ThoiKhoaBieu_idNguoiDung_idx" ON "ThoiKhoaBieu"("idNguoiDung");

-- CreateIndex
CREATE INDEX "Deadline_idNguoiDung_idx" ON "Deadline"("idNguoiDung");

-- CreateIndex
CREATE INDEX "Deadline_idNguoiDung_hanChot_idx" ON "Deadline"("idNguoiDung", "hanChot");

-- CreateIndex
CREATE INDEX "Diem_idMonHoc_idx" ON "Diem"("idMonHoc");

-- CreateIndex
CREATE INDEX "GiaoDich_idNguoiDung_idx" ON "GiaoDich"("idNguoiDung");

-- CreateIndex
CREATE INDEX "GiaoDich_idNguoiDung_ngayGiaoDich_idx" ON "GiaoDich"("idNguoiDung", "ngayGiaoDich");

-- CreateIndex
CREATE INDEX "MonHoc_idNguoiDung_idx" ON "MonHoc"("idNguoiDung");

-- CreateIndex
CREATE INDEX "NganSach_idNguoiDung_idx" ON "NganSach"("idNguoiDung");

-- CreateIndex
CREATE INDEX "NganSach_idNguoiDung_thang_nam_idx" ON "NganSach"("idNguoiDung", "thang", "nam");

-- AddForeignKey
ALTER TABLE "ThoiKhoaBieu" ADD CONSTRAINT "ThoiKhoaBieu_idNguoiDung_fkey" FOREIGN KEY ("idNguoiDung") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;
