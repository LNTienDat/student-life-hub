/**
 * academic.service.js
 * Tầng nghiệp vụ (Service Layer) cho module Học tập & Điểm số
 * Tách biệt thuật toán tính toán điểm khỏi tầng Controller.
 */

const { tinhDiemMon } = require('../../utils/grade.util');
const { ACADEMIC } = require('../../constants');

/**
 * Tính điểm trung bình tích lũy GPA tổng thể từ danh sách môn học
 * @param {Array} monHocs - Danh sách môn học kèm mảng diems
 * @returns {{ gpa: string, chiTiet: Array }}
 */
function tinhGPAService(monHocs) {
  let tongDiemTinChi = 0;
  let tongTinChi = 0;

  const chiTiet = monHocs.map((mon) => {
    const { diemTrungBinh: diemMon, tongTrongSo } = tinhDiemMon(mon.diems);

    if (tongTrongSo > 0) {
      tongDiemTinChi += diemMon * mon.tinChi;
      tongTinChi += mon.tinChi;
    }

    return {
      ten: mon.ten,
      tinChi: mon.tinChi,
      diemMon: diemMon.toFixed(2),
    };
  });

  const gpa = tongTinChi > 0 ? (tongDiemTinChi / tongTinChi).toFixed(2) : '0';
  return { gpa, chiTiet };
}

/**
 * Lọc danh sách các môn có nguy cơ điểm thấp dưới ngưỡng cảnh báo
 * @param {Array} monHocs - Danh sách môn học kèm mảng diems
 * @param {number} nguong - Ngưỡng điểm cảnh báo (mặc định 5.0)
 * @returns {Array} Danh sách môn có nguy cơ
 */
function canhBaoMonNguyCoService(monHocs, nguong = ACADEMIC.DEFAULT_NGUONG_CANH_BAO) {
  return monHocs
    .map((mon) => {
      const { diemTrungBinh: diemHienTai, tongTrongSo: tongTrongSoDaCham } = tinhDiemMon(mon.diems);
      return {
        ten: mon.ten,
        diemHienTai: diemHienTai.toFixed(2),
        tongTrongSoDaCham,
      };
    })
    .filter((mon) => mon.tongTrongSoDaCham > 0 && parseFloat(mon.diemHienTai) < nguong);
}

/**
 * Tính điểm GPA theo từng học kỳ
 * @param {Array} monHocs - Danh sách môn học kèm mảng diems
 * @returns {Array} Mảng các { hocKy, gpa }
 */
function gpaTheoKyService(monHocs) {
  const theoKy = {};

  monHocs.forEach((mon) => {
    const { diemTrungBinh: diemMon, tongTrongSo } = tinhDiemMon(mon.diems);
    if (tongTrongSo === 0) return;

    if (!theoKy[mon.hocKy]) {
      theoKy[mon.hocKy] = { tongDiemTinChi: 0, tongTinChi: 0 };
    }
    theoKy[mon.hocKy].tongDiemTinChi += diemMon * mon.tinChi;
    theoKy[mon.hocKy].tongTinChi += mon.tinChi;
  });

  return Object.entries(theoKy).map(([hocKy, data]) => ({
    hocKy,
    gpa: (data.tongDiemTinChi / data.tongTinChi).toFixed(2),
  }));
}

/**
 * Dự đoán điểm cần đạt ở đầu điểm còn thiếu để đạt mục tiêu
 * @param {number} tongDaBiet - Tổng điểm có trọng số các cột đã có
 * @param {number} trongSoConLai - Trọng số phần trăm còn thiếu (0 - 100)
 * @param {number} mucTieu - Điểm mục tiêu thang 10
 * @returns {{ mucTieu: number, tongDaDat: string, diemCanDat: string, khaThi: boolean }}
 */
function duDoanDiemService(tongDaBiet, trongSoConLai, mucTieu) {
  const trongSoConLaiSo = parseFloat(trongSoConLai) / 100;
  const mucTieuSo = parseFloat(mucTieu);

  const diemCanDat = (mucTieuSo - tongDaBiet) / trongSoConLaiSo;

  return {
    mucTieu: mucTieuSo,
    tongDaDat: tongDaBiet.toFixed(2),
    diemCanDat: diemCanDat.toFixed(2),
    khaThi: diemCanDat <= ACADEMIC.THANG_DIEM_MAX && diemCanDat >= ACADEMIC.THANG_DIEM_MIN,
  };
}

module.exports = {
  tinhGPAService,
  canhBaoMonNguyCoService,
  gpaTheoKyService,
  duDoanDiemService,
};
