CREATE TABLE "TaiLieuRag" (
  "id" SERIAL NOT NULL,
  "idNguoiDung" INTEGER NOT NULL,
  "tieuDe" TEXT NOT NULL,
  "tenTep" TEXT NOT NULL,
  "bamNoiDung" TEXT NOT NULL,
  "soKyTu" INTEGER NOT NULL,
  "soTrang" INTEGER NOT NULL,
  "cacDoan" JSONB NOT NULL,
  "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaiLieuRag_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TaiLieuRag_idNguoiDung_fkey" FOREIGN KEY ("idNguoiDung") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TaiLieuRag_idNguoiDung_bamNoiDung_key" ON "TaiLieuRag"("idNguoiDung", "bamNoiDung");
CREATE INDEX "TaiLieuRag_idNguoiDung_ngayTao_idx" ON "TaiLieuRag"("idNguoiDung", "ngayTao");
