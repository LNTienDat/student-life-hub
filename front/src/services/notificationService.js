import api from './api';

export const notificationService = {
  layThongBao: () => api.get('/thong-bao'),
  testCronDeadline: () => api.post('/thong-bao/test-cron/deadline'),
  testCronNganSach: () => api.post('/thong-bao/test-cron/ngan-sach'),
};

export default notificationService;
