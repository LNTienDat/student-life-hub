import api from './api';

export const timetableService = {
  layThoiKhoaBieu: () => api.get('/thoi-khoa-bieu'),
  themBuoiHoc: (data) => api.post('/thoi-khoa-bieu', data),
  suaBuoiHoc: (id, data) => api.put(`/thoi-khoa-bieu/${id}`, data),
  xoaBuoiHoc: (id) => api.delete(`/thoi-khoa-bieu/${id}`),
};

export default timetableService;
