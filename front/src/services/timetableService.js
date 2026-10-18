import api from './api';

export const timetableService = {
  layThoiKhoaBieu: (hocKy) => api.get('/thoi-khoa-bieu', { params: { hocKy } }),
  themBuoiHoc: (data) => api.post('/thoi-khoa-bieu', data),
  suaBuoiHoc: (id, data) => api.put(`/thoi-khoa-bieu/${id}`, data),
  xoaBuoiHoc: (id) => api.delete(`/thoi-khoa-bieu/${id}`),
};

export default timetableService;
