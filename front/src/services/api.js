import { createApiClient } from './apiClient.js';
import backendConnection, { apiBaseURL } from './backendRuntime.js';

export default createApiClient({ baseURL: apiBaseURL, connection: backendConnection });
