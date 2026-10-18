import { createPwaClient } from './client.js';

const pwaClient = createPwaClient({ window, navigator, enabled: import.meta.env.PROD });
export default pwaClient;
