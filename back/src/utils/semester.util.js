function normalizeSemester(value) {
  return String(value || '').normalize('NFKC').trim().replace(/[–—]/g, '-').replace(/\s+/g, ' ').replace(/\s*([-\/])\s*/g, '$1').toLocaleUpperCase('vi');
}
function filterSemester(rows, value, shared = false) {
  const key = normalizeSemester(value);
  return rows.filter(row => !key || (shared && !row.hocKy) || normalizeSemester(row.hocKy) === key)
    .map(row => ({ ...row, hocKy: normalizeSemester(row.hocKy) }));
}
module.exports = { normalizeSemester, filterSemester };
