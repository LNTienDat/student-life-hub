import axios from 'axios';
import { createBackendConnection } from './backendConnection.js';

export const apiBaseURL = import.meta.env?.VITE_API_URL || '/api';
const health = axios.create({ baseURL: apiBaseURL, timeout: 10000, headers: { Accept: 'application/json' } });
const backendConnection = createBackendConnection({
  enabled: import.meta.env?.PROD === true,
  online: () => typeof navigator === 'undefined' || navigator.onLine !== false,
  probe: async ({ signal }) => {
    const response = await health.get('/health', { signal, params: { _slh: Date.now() } });
    return response.status === 200 && response.data?.status === 'ok'
      && String(response.headers['content-type'] || '').includes('application/json');
  },
});
export default backendConnection;
