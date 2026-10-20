export function transactionQuery(filters = {}, page = 1) {
  const query = { trang: page, soLuong: 10 };
  if (filters.timKiem?.trim()) query.q = filters.timKiem.trim();
  if (filters.locLoai) query.loai = filters.locLoai;
  if (filters.locDanhMuc) query.danhMuc = filters.locDanhMuc;
  if (filters.chiThangNay) {
    query.thang = filters.thang;
    query.nam = filters.nam;
  }
  return query;
}

export function financeSummary(thongKe, budgetResponse, trendResponse) {
  return {
    thongKe,
    nganSachs: budgetResponse.ketQua || [],
    xuHuong: trendResponse.xuHuong || [],
  };
}

export function localDateInput(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
