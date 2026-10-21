import api from './api';

export const deadlineService = {
  layDanhSachDeadline: (hocKy) => api.get('/deadline', { params: { hocKy } }),
  themDeadline: (data) => api.post('/deadline', data),
  suaDeadline: (id, data) => api.put(`/deadline/${id}`, data),
  xoaDeadline: (id) => api.delete(`/deadline/${id}`),
  hoanThanhDeadline: (id) => api.patch(`/deadline/${id}/hoan-thanh`),
  layDeadlineSapToi: (soNgay = 7, hocKy) => api.get('/deadline/sap-toi', { params: { soNgay, hocKy } }),
};

export default deadlineService;
