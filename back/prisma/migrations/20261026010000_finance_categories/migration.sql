CREATE TABLE "DanhMucTaiChinh" (
  "id" SERIAL NOT NULL, "idNguoiDung" INTEGER NOT NULL, "ma" TEXT NOT NULL,
  "ten" TEXT NOT NULL, "tenChuanHoa" TEXT NOT NULL, "loai" TEXT NOT NULL,
  "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DanhMucTaiChinh_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DanhMucTaiChinh_loai_check" CHECK ("loai" IN ('thu','chi'))
);
CREATE UNIQUE INDEX "DanhMucTaiChinh_idNguoiDung_ma_key" ON "DanhMucTaiChinh"("idNguoiDung","ma");
CREATE UNIQUE INDEX "DanhMucTaiChinh_idNguoiDung_loai_tenChuanHoa_key" ON "DanhMucTaiChinh"("idNguoiDung","loai","tenChuanHoa");
CREATE INDEX "DanhMucTaiChinh_idNguoiDung_idx" ON "DanhMucTaiChinh"("idNguoiDung");
ALTER TABLE "DanhMucTaiChinh" ADD CONSTRAINT "DanhMucTaiChinh_idNguoiDung_fkey" FOREIGN KEY ("idNguoiDung") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;
