import api from './api';

export const authService = {
  dangKy: (data) => api.post('/auth/dang-ky', data),
  dangNhap: (data) => api.post('/auth/dang-nhap', data),
  xemHoSo: () => api.get('/auth/ho-so'),
  suaHoSo: (data) => api.put('/auth/ho-so', data),
  doiMatKhau: (data) => api.put('/auth/doi-mat-khau', data),
  doiEmail: (data) => api.put('/auth/doi-email', data),
  quenMatKhau: (data) => api.post('/auth/quen-mat-khau', data),
  datLaiMatKhau: (data) => api.post('/auth/dat-lai-mat-khau', data),
};

export default authService;
