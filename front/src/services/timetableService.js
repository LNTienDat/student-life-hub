import api from './api';

export const timetableService = {
  layThoiKhoaBieu: (hocKy,tuNgay) => api.get('/thoi-khoa-bieu', { params: { hocKy,tuNgay } }),
  themBuoiHoc: (data) => api.post('/thoi-khoa-bieu', data),
  suaBuoiHoc: (id, data) => api.put(`/thoi-khoa-bieu/${id}`, data),
  xoaBuoiHoc: (id) => api.delete(`/thoi-khoa-bieu/${id}`),
  datDieuChinh: (id,data) => api.put('/thoi-khoa-bieu/'+id+'/dieu-chinh',data),
  xoaDieuChinh: id => api.delete('/thoi-khoa-bieu/dieu-chinh/'+id),
  xoaNhieuBuoiHoc: (ids) => api.post('/thoi-khoa-bieu/xoa-nhieu', { ids }),
  // Tính năng chia sẻ TKB
  layTrangThaiChiaSe: () => api.get('/thoi-khoa-bieu/share/trang-thai'),
  batChiaSe: (hocKy) => api.post('/thoi-khoa-bieu/share/bat', hocKy === undefined ? {} : { hocKy }),
  tatChiaSe: () => api.post('/thoi-khoa-bieu/share/tat'),
  xemPublic: (token,tuNgay) => api.get(`/thoi-khoa-bieu/share/public/${token}`,{params:{tuNgay}}),
};

export default timetableService;
