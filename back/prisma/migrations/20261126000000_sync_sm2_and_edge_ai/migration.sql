CREATE TABLE "BoTheOnTap" (
    "id" SERIAL NOT NULL,
    "idNguoiDung" INTEGER NOT NULL,
    "phienBan" INTEGER NOT NULL DEFAULT 1,
    "tongLuotOn" INTEGER NOT NULL DEFAULT 0,
    "cacThe" JSONB NOT NULL DEFAULT '[]',
    "capNhatLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoTheOnTap_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MoHinhEdgeAi" (
    "id" SERIAL NOT NULL,
    "idNguoiDung" INTEGER NOT NULL,
    "phienBan" INTEGER NOT NULL DEFAULT 1,
    "duLieu" JSONB NOT NULL DEFAULT '{}',
    "capNhatLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoHinhEdgeAi_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BoTheOnTap_idNguoiDung_key" ON "BoTheOnTap"("idNguoiDung");
CREATE UNIQUE INDEX "MoHinhEdgeAi_idNguoiDung_key" ON "MoHinhEdgeAi"("idNguoiDung");

ALTER TABLE "BoTheOnTap" ADD CONSTRAINT "BoTheOnTap_idNguoiDung_fkey" FOREIGN KEY ("idNguoiDung") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MoHinhEdgeAi" ADD CONSTRAINT "MoHinhEdgeAi_idNguoiDung_fkey" FOREIGN KEY ("idNguoiDung") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;
