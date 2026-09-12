/**
 * Tính điểm trung bình một môn học từ danh sách các điểm
 * @param {Array} diems - Mảng các { diem, trongSo }
 * @returns {{ diemTrungBinh: number, tongTrongSo: number }}
 */
function tinhDiemMon(diems) {
  if (!diems || diems.length === 0) return { diemTrungBinh: 0, tongTrongSo: 0 };
  const tongTrongSo = diems.reduce((sum, d) => sum + d.trongSo, 0);
  if (tongTrongSo === 0) return { diemTrungBinh: 0, tongTrongSo: 0 };
  const diemTrungBinh = diems.reduce((sum, d) => sum + d.diem * (d.trongSo / 100), 0);
  return { diemTrungBinh, tongTrongSo };
}

/**
 * Quy đổi điểm hệ 10 sang hệ 4
 * @param {number} diem10 - Điểm hệ 10
 * @returns {number} Điểm hệ 4
 */
function quyDoiHe4(diem10) {
  if (diem10 >= 8.5) return 4.0;
  if (diem10 >= 7.0) return 3.0;
  if (diem10 >= 5.5) return 2.0;
  if (diem10 >= 4.0) return 1.0;
  return 0;
}

module.exports = { tinhDiemMon, quyDoiHe4 };
