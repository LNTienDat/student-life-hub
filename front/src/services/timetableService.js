import api from './api';

export const timetableService = {
  layThoiKhoaBieu: (hocKy) => api.get('/thoi-khoa-bieu', { params: { hocKy } }),
  themBuoiHoc: (data) => api.post('/thoi-khoa-bieu', data),
  suaBuoiHoc: (id, data) => api.put(`/thoi-khoa-bieu/${id}`, data),
  xoaBuoiHoc: (id) => api.delete(`/thoi-khoa-bieu/${id}`),
  // Tính năng chia sẻ TKB
  layTrangThaiChiaSe: () => api.get('/thoi-khoa-bieu/share/trang-thai'),
  batChiaSe: () => api.post('/thoi-khoa-bieu/share/bat'),
  tatChiaSe: () => api.post('/thoi-khoa-bieu/share/tat'),
  xemPublic: (token) => api.get(`/thoi-khoa-bieu/share/public/${token}`),
};

export default timetableService;
