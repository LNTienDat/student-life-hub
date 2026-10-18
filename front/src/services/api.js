import axios from 'axios';
import { notifyDataChanged } from './dataEvents.js';

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || '/api',
  timeout: 20000,
});

// Tự động đính kèm token vào mọi request nếu có
api.interceptors.request.use((config) => {
  if (window.navigator?.onLine === false) {
    return Promise.reject(new axios.AxiosError('Thiết bị đang mất mạng. Kết nối lại để lưu dữ liệu.', 'ERR_NETWORK', config));
  }
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let dangChuyenHuong = false;

// Tự động xử lý khi phiên đăng nhập hết hạn hoặc token bị thu hồi
api.interceptors.response.use(
  (response) => {
    if (['post', 'put', 'patch', 'delete'].includes(response.config.method)
      && /^\/(academic|deadline|finance|thoi-khoa-bieu|imports)(\/|$)/.test(response.config.url)
      && !response.config.url.includes('/preview')
      && !response.config.url.endsWith('/du-doan')) notifyDataChanged();
    return response;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    const publicPaths = ['/login', '/register', '/quen-mat-khau', '/dat-lai-mat-khau'];
    const currentPath = window.location.pathname;

    if (
      (status === 401 || status === 403) &&
      !publicPaths.some((p) => currentPath.startsWith(p)) &&
      !dangChuyenHuong
    ) {
      dangChuyenHuong = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
