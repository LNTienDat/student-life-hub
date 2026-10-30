import { defineConfig } from '@playwright/test';

// Refuse to run against a real user database or a remotely hosted application.
const db = new URL(process.env.DATABASE_URL || 'postgresql://invalid/');
if (!['localhost', '127.0.0.1'].includes(db.hostname) || !/^\/[a-z0-9_]+_test$/i.test(db.pathname)) {
  throw new Error('E2E requires DATABASE_URL for a dedicated local database ending in _test.');
}
const backend = 'http://127.0.0.1:5063';
const frontend = 'http://127.0.0.1:5193';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  globalTimeout: 6 * 60 * 1000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: frontend, browserName: 'chromium', timezoneId: 'Asia/Ho_Chi_Minh',
    viewport: { width: 1440, height: 1000 },
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'node app.js', cwd: '../back', url: backend + '/api/health', reuseExistingServer: false,
      env: { DATABASE_URL: db.href, NODE_ENV: 'development', PORT: '5063',
        JWT_SECRET: 'lifehub-e2e-isolated-only-20261029', CHATBOT_AI_ENABLED: 'false',
        GEMINI_API_KEY: '', ENABLE_CRON_JOBS: 'false', SERVE_FRONTEND: 'false',
        EMAIL_PROVIDER: 'disabled', RESEND_API_KEY: '', FRONTEND_URL: frontend, TRUST_PROXY: 'false' },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5193 --strictPort',
      url: frontend + '/login', reuseExistingServer: false,
      env: { VITE_API_URL: backend + '/api' },
    },
  ],
});
