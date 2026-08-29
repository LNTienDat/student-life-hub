/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "NguoiDung" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "matKhau" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "avatar" TEXT,
    "truong" TEXT,
    "nganh" TEXT,
    "khoaHoc" TEXT,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NguoiDung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonHoc" (
    "id" SERIAL NOT NULL,
    "idNguoiDung" INTEGER NOT NULL,
    "ten" TEXT NOT NULL,
    "tinChi" INTEGER NOT NULL,
    "hocKy" TEXT NOT NULL,
    "trangThai" TEXT NOT NULL DEFAULT 'active',
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonHoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diem" (
    "id" SERIAL NOT NULL,
    "idMonHoc" INTEGER NOT NULL,
    "loaiDanhGia" TEXT NOT NULL,
    "diem" DOUBLE PRECISION NOT NULL,
    "trongSo" DOUBLE PRECISION NOT NULL,
    "ngayGhiNhan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" SERIAL NOT NULL,
    "idNguoiDung" INTEGER NOT NULL,
    "idMonHoc" INTEGER,
    "tieuDe" TEXT NOT NULL,
    "moTa" TEXT,
    "hanChot" TIMESTAMP(3) NOT NULL,
    "doUuTien" TEXT NOT NULL DEFAULT 'binh_thuong',
    "trangThai" TEXT NOT NULL DEFAULT 'dang_dien_hanh',
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiaoDich" (
    "id" SERIAL NOT NULL,
    "idNguoiDung" INTEGER NOT NULL,
    "loai" TEXT NOT NULL,
    "danhMuc" TEXT NOT NULL,
    "soTien" DOUBLE PRECISION NOT NULL,
    "moTa" TEXT,
    "ngayGiaoDich" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiaoDich_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NganSach" (
    "id" SERIAL NOT NULL,
    "idNguoiDung" INTEGER NOT NULL,
    "danhMuc" TEXT NOT NULL,
    "soTienToiDa" DOUBLE PRECISION NOT NULL,
    "thang" INTEGER NOT NULL,
    "nam" INTEGER NOT NULL,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NganSach_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NguoiDung_email_key" ON "NguoiDung"("email");

-- AddForeignKey
ALTER TABLE "MonHoc" ADD CONSTRAINT "MonHoc_idNguoiDung_fkey" FOREIGN KEY ("idNguoiDung") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diem" ADD CONSTRAINT "Diem_idMonHoc_fkey" FOREIGN KEY ("idMonHoc") REFERENCES "MonHoc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_idNguoiDung_fkey" FOREIGN KEY ("idNguoiDung") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_idMonHoc_fkey" FOREIGN KEY ("idMonHoc") REFERENCES "MonHoc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiaoDich" ADD CONSTRAINT "GiaoDich_idNguoiDung_fkey" FOREIGN KEY ("idNguoiDung") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NganSach" ADD CONSTRAINT "NganSach_idNguoiDung_fkey" FOREIGN KEY ("idNguoiDung") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;
