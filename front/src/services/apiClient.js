import axios from 'axios';
import { notifyDataChanged } from './dataEvents.js';

function userError(error, config, message = error.message) {
  error.message = message;
  error.config ||= config;
  error.response ||= { status: 503, data: { message }, config };
  return error;
}
function availabilityError(error) {
  if (axios.isCancel(error) || error.code === 'ERR_BACKEND_UNAVAILABLE') return false;
  return error.code === 'ERR_BACKEND_HTML'
    || (!error.response && ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code))
    || [502, 504].includes(error.response?.status)
    || (error.response?.status === 503 && error.config?.method === 'get');
}
export function createApiClient({ baseURL = '/api', connection } = {}) {
  const api = axios.create({ baseURL, timeout: 20000 });
  let redirecting = false;
  api.interceptors.request.use(async config => {
    if (typeof window !== 'undefined' && window.navigator?.onLine === false) {
      throw userError(new axios.AxiosError('Thiết bị đang mất mạng. Kết nối lại để lưu dữ liệu.', 'ERR_NETWORK', config), config);
    }
    if (connection?.enabled) {
      try { await connection.ensureReady(); }
      catch (error) { throw userError(error, config); }
    }
    if (config.signal?.aborted) throw new axios.CanceledError('Request canceled', config);
    const token = typeof localStorage !== 'undefined' && localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  async function handleError(error) {
    const config = error.config;
    if (connection?.enabled && availabilityError(error)) {
      connection.markUnavailable();
      // Only GET can be retried. A lost POST/PUT/PATCH/DELETE response is ambiguous.
      if (config?.method === 'get' && !config.slhReadRetried) {
        config.slhReadRetried = true;
        try { await connection.ensureReady(true); }
        catch (unavailable) { throw userError(unavailable, config); }
        return api.request(config);
      }
      const message = config?.method === 'get'
        ? 'Chưa tải được dữ liệu. Hãy thử kết nối lại.'
        : 'Chưa xác nhận thao tác đã được lưu. Kiểm tra lại danh sách trước khi gửi lại để tránh trùng dữ liệu.';
      error.response = { ...error.response, status: error.response?.status || 503, data: { message }, config };
      error.message = message;
    }
    const status = error.response?.status;
    if (typeof window !== 'undefined') {
      const publicPaths = ['/login', '/register', '/quen-mat-khau', '/dat-lai-mat-khau'];
      if ((status === 401 || (status === 403 && error.response?.data?.code === 'AUTH_INVALID'))
        && !publicPaths.some(path => window.location.pathname.startsWith(path)) && !redirecting) {
        redirecting = true;
        localStorage.removeItem('token'); localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    throw error;
  }
  api.interceptors.response.use(response => {
    if (String(response.headers?.['content-type'] || '').includes('text/html')) {
      return handleError(new axios.AxiosError('Máy chủ chưa sẵn sàng.', 'ERR_BACKEND_HTML', response.config, null, response));
    }
    connection?.enabled && connection.confirmReady();
    if (['post', 'put', 'patch', 'delete'].includes(response.config.method)
      && /^\/(academic|deadline|finance|thoi-khoa-bieu|imports)(\/|$)/.test(response.config.url)
      && !response.config.url.includes('/preview') && !response.config.url.endsWith('/du-doan')) notifyDataChanged();
    return response;
  }, handleError);
  return api;
}
