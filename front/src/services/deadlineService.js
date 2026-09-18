import api from './api';

export const deadlineService = {
  layDanhSachDeadline: () => api.get('/deadline'),
  themDeadline: (data) => api.post('/deadline', data),
  suaDeadline: (id, data) => api.put(`/deadline/${id}`, data),
  xoaDeadline: (id) => api.delete(`/deadline/${id}`),
  hoanThanhDeadline: (id) => api.patch(`/deadline/${id}/hoan-thanh`),
  layDeadlineSapToi: (soNgay = 7) => api.get(`/deadline/sap-toi?soNgay=${soNgay}`),
};

export default deadlineService;
