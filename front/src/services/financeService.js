import api from './api';

export const financeService = {
  layDanhSachGiaoDich: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/finance/giao-dich?${q}`);
  },
  themGiaoDich: (data) => api.post('/finance/giao-dich', data),
  xoaGiaoDich: (id) => api.delete(`/finance/giao-dich/${id}`),

  layThongKe: (thang, nam) => {
    const q = thang && nam ? `?thang=${thang}&nam=${nam}` : '';
    return api.get(`/finance/thong-ke${q}`);
  },
  layNganSach: (thang, nam) => {
    const q = thang && nam ? `?thang=${thang}&nam=${nam}` : '';
    return api.get(`/finance/ngan-sach${q}`);
  },
  datNganSach: (data) => api.post('/finance/ngan-sach', data),
  layXuHuong: (soThang = 6) => api.get(`/finance/xu-huong?soThang=${soThang}`),
  xuatBaoCaoExcel: (thang, nam) => {
    const q = thang && nam ? `?thang=${thang}&nam=${nam}` : '';
    return api.get(`/finance/xuat-bao-cao${q}`, { responseType: 'blob' });
  },
};

export default financeService;
