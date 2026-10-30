import api from './api';

export const financeService = {
  layDanhSachGiaoDich: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/finance/giao-dich?${q}`);
  },
  themGiaoDich: (data) => api.post('/finance/giao-dich', data),
  suaGiaoDich: (id, data) => api.put(`/finance/giao-dich/${id}`, data),
  xoaGiaoDich: (id) => api.delete(`/finance/giao-dich/${id}`),

  layThongKe: (thang, nam) => {
    const q = thang && nam ? `?thang=${thang}&nam=${nam}` : '';
    return api.get(`/finance/thong-ke${q}`);
  },
  layNganSach: (thang, nam) => {
    const q = thang && nam ? `?thang=${thang}&nam=${nam}` : '';
    return api.get(`/finance/ngan-sach${q}`);
  },
  xoaNganSach: id => api.delete('/finance/ngan-sach/'+id),
  datNganSach: (data) => api.post('/finance/ngan-sach', data),
  layXuHuong: (soThang = 6, thang, nam) => {
    const params = new URLSearchParams({ soThang });
    if (thang && nam) { params.set('thang', thang); params.set('nam', nam); }
    return api.get(`/finance/xu-huong?${params}`);
  },
  xuatBaoCaoExcel: (thang, nam) => {
    const q = thang && nam ? `?thang=${thang}&nam=${nam}` : '';
    return api.get(`/finance/xuat-bao-cao${q}`, { responseType: 'blob', timeout: 60000 });
  },
};

export default financeService;
