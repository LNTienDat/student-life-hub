const { normalizeSemester } = require('../../utils/semester.util');
function overlaps(a, b) {
  return a.thu === b.thu && (!a.hocKy || !b.hocKy || normalizeSemester(a.hocKy) === normalizeSemester(b.hocKy)) && a.gioBatDau < b.gioKetThuc && a.gioKetThuc > b.gioBatDau;
}
module.exports = { overlaps };
