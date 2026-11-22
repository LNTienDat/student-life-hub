import api from './api';

export function generateRagStudyPack(docId, { soLuong = 6, chuDe = '', dungAI = true } = {}, options = {}) {
  return api.post(
    '/tai-lieu/' + encodeURIComponent(docId) + '/tao-on-tap',
    { soLuong, chuDe, dungAI },
    { timeout: 30000, ...options },
  );
}
