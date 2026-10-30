ALTER TABLE "NguoiDung" ADD COLUMN "hocKyDaLuu" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "NguoiDung" u SET "hocKyDaLuu" = ARRAY(
  SELECT DISTINCT btrim(s.name) FROM (
    SELECT u."hocKyHienTai" AS name
    UNION ALL SELECT m."hocKy" FROM "MonHoc" m WHERE m."idNguoiDung"=u.id
    UNION ALL SELECT t."hocKy" FROM "ThoiKhoaBieu" t WHERE t."idNguoiDung"=u.id
  ) s WHERE s.name IS NOT NULL AND btrim(s.name)<>''
);
