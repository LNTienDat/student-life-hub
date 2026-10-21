import api from './api';

export const academicService = {
  layDanhSachMonHoc: (hocKy) => api.get('/academic/mon-hoc', { params: { hocKy } }),
  themMonHoc: (data) => api.post('/academic/mon-hoc', data),
  suaMonHoc: (id, data) => api.put(`/academic/mon-hoc/${id}`, data),
  xoaMonHoc: (id) => api.delete(`/academic/mon-hoc/${id}`),

  themDiem: (idMonHoc, data) => api.post(`/academic/mon-hoc/${idMonHoc}/diem`, data),
  suaDiem: (id, data) => api.put(`/academic/diem/${id}`, data),
  xoaDiem: (id) => api.delete(`/academic/diem/${id}`),

  tinhGPA: (hocKy) => api.get('/academic/gpa', { params: { hocKy } }),
  canhBaoMonNguyCo: (nguong = 5.0, hocKy) => api.get('/academic/canh-bao', { params: { nguong, hocKy } }),
  gpaTheoKy: () => api.get('/academic/gpa-theo-ky'),
  duDoanDiem: (idMonHoc, data) => api.post(`/academic/mon-hoc/${idMonHoc}/du-doan`, data),
  xuatBangDiemPDF: (hocKy) => api.get('/academic/xuat-bang-diem', { responseType: 'blob', params: { hocKy }, timeout: 60000 }),
};

export default academicService;
