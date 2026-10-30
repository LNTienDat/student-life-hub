export function normalizeSemester(value) {
  return String(value || '').normalize('NFKC').trim().replace(/[–—]/g, '-').replace(/\s+/g, ' ').replace(/\s*([-/])\s*/g, '$1').toLocaleUpperCase('vi');
}
