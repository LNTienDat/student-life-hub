import api from './api';

export const academicService = {
  layDanhSachMonHoc: () => api.get('/academic/mon-hoc'),
  themMonHoc: (data) => api.post('/academic/mon-hoc', data),
  suaMonHoc: (id, data) => api.put(`/academic/mon-hoc/${id}`, data),
  xoaMonHoc: (id) => api.delete(`/academic/mon-hoc/${id}`),

  themDiem: (idMonHoc, data) => api.post(`/academic/mon-hoc/${idMonHoc}/diem`, data),
  suaDiem: (id, data) => api.put(`/academic/diem/${id}`, data),
  xoaDiem: (id) => api.delete(`/academic/diem/${id}`),

  tinhGPA: () => api.get('/academic/gpa'),
  canhBaoMonNguyCo: (nguong = 5.0) => api.get(`/academic/canh-bao?nguong=${nguong}`),
  gpaTheoKy: () => api.get('/academic/gpa-theo-ky'),
  duDoanDiem: (idMonHoc, data) => api.post(`/academic/mon-hoc/${idMonHoc}/du-doan`, data),
  xuatBangDiemPDF: () => api.get('/academic/xuat-bang-diem', { responseType: 'blob' }),
};

export default academicService;
