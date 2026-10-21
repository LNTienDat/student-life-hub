function overlaps(a, b) {
  return a.thu === b.thu && (!a.hocKy || !b.hocKy || a.hocKy === b.hocKy) && a.gioBatDau < b.gioKetThuc && a.gioKetThuc > b.gioBatDau;
}
module.exports = { overlaps };
