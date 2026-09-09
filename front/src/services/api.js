import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Tự động đính kèm token vào mọi request nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tự động xử lý khi phiên đăng nhập hết hạn hoặc token bị thu hồi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const publicPaths = ['/login', '/register', '/quen-mat-khau', '/dat-lai-mat-khau'];
    const currentPath = window.location.pathname;

    if (
      (status === 401 || status === 403) &&
      !publicPaths.some((p) => currentPath.startsWith(p))
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;