-- AlterTable
ALTER TABLE "NguoiDung" ADD COLUMN     "shareEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareToken" TEXT;

-- CreateTable
CREATE TABLE "NhomHocTap" (
    "id" SERIAL NOT NULL,
    "ten" TEXT NOT NULL,
    "moTa" TEXT,
    "maCode" TEXT NOT NULL,
    "idChuNhom" INTEGER NOT NULL,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NhomHocTap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThanhVienNhom" (
    "id" SERIAL NOT NULL,
    "idNhom" INTEGER NOT NULL,
    "idNguoiDung" INTEGER NOT NULL,
    "vaiTro" TEXT NOT NULL DEFAULT 'thanh_vien',
    "ngayThamGia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThanhVienNhom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeadlineNhom" (
    "id" SERIAL NOT NULL,
    "idNhom" INTEGER NOT NULL,
    "idNguoiTao" INTEGER NOT NULL,
    "tieuDe" TEXT NOT NULL,
    "moTa" TEXT,
    "hanChot" TIMESTAMP(3) NOT NULL,
    "doUuTien" TEXT NOT NULL DEFAULT 'binh_thuong',
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeadlineNhom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TienDoDeadlineNhom" (
    "id" SERIAL NOT NULL,
    "idDeadlineNhom" INTEGER NOT NULL,
    "idNguoiDung" INTEGER NOT NULL,
    "trangThai" TEXT NOT NULL DEFAULT 'chua_lam',
    "ghiChu" TEXT,
    "capNhatLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TienDoDeadlineNhom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NhomHocTap_maCode_key" ON "NhomHocTap"("maCode");

-- CreateIndex
CREATE INDEX "NhomHocTap_maCode_idx" ON "NhomHocTap"("maCode");

-- CreateIndex
CREATE INDEX "NhomHocTap_idChuNhom_idx" ON "NhomHocTap"("idChuNhom");

-- CreateIndex
CREATE INDEX "ThanhVienNhom_idNguoiDung_idx" ON "ThanhVienNhom"("idNguoiDung");

-- CreateIndex
CREATE INDEX "ThanhVienNhom_idNhom_idx" ON "ThanhVienNhom"("idNhom");

-- CreateIndex
CREATE UNIQUE INDEX "ThanhVienNhom_idNhom_idNguoiDung_key" ON "ThanhVienNhom"("idNhom", "idNguoiDung");

-- CreateIndex
CREATE INDEX "DeadlineNhom_idNhom_idx" ON "DeadlineNhom"("idNhom");

-- CreateIndex
CREATE INDEX "DeadlineNhom_idNhom_hanChot_idx" ON "DeadlineNhom"("idNhom", "hanChot");

-- CreateIndex
CREATE INDEX "TienDoDeadlineNhom_idNguoiDung_idx" ON "TienDoDeadlineNhom"("idNguoiDung");

-- CreateIndex
CREATE INDEX "TienDoDeadlineNhom_idDeadlineNhom_idx" ON "TienDoDeadlineNhom"("idDeadlineNhom");

-- CreateIndex
CREATE UNIQUE INDEX "TienDoDeadlineNhom_idDeadlineNhom_idNguoiDung_key" ON "TienDoDeadlineNhom"("idDeadlineNhom", "idNguoiDung");

-- CreateIndex
CREATE UNIQUE INDEX "NguoiDung_shareToken_key" ON "NguoiDung"("shareToken");

-- AddForeignKey
ALTER TABLE "NhomHocTap" ADD CONSTRAINT "NhomHocTap_idChuNhom_fkey" FOREIGN KEY ("idChuNhom") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThanhVienNhom" ADD CONSTRAINT "ThanhVienNhom_idNhom_fkey" FOREIGN KEY ("idNhom") REFERENCES "NhomHocTap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThanhVienNhom" ADD CONSTRAINT "ThanhVienNhom_idNguoiDung_fkey" FOREIGN KEY ("idNguoiDung") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeadlineNhom" ADD CONSTRAINT "DeadlineNhom_idNhom_fkey" FOREIGN KEY ("idNhom") REFERENCES "NhomHocTap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeadlineNhom" ADD CONSTRAINT "DeadlineNhom_idNguoiTao_fkey" FOREIGN KEY ("idNguoiTao") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TienDoDeadlineNhom" ADD CONSTRAINT "TienDoDeadlineNhom_idDeadlineNhom_fkey" FOREIGN KEY ("idDeadlineNhom") REFERENCES "DeadlineNhom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TienDoDeadlineNhom" ADD CONSTRAINT "TienDoDeadlineNhom_idNguoiDung_fkey" FOREIGN KEY ("idNguoiDung") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;
