const { deploymentConfig } = require('../../src/deployment');
const production = {
  NODE_ENV: 'production', SERVE_FRONTEND: 'true', JWT_SECRET: 'a'.repeat(48),
  DATABASE_URL: 'postgresql://test:test@db.hosted.example/studenthub',
  RENDER_EXTERNAL_URL: 'https://studenthub.onrender.com', ENABLE_CRON_JOBS: 'false',
};
test('local mode stays separate and deployment derives its own HTTPS URL', () => {
  expect(deploymentConfig({}).serveFrontend).toBe(false);
  expect(deploymentConfig({}).enableCron).toBe(true);
  expect(deploymentConfig(production)).toEqual({ serveFrontend: true, frontendUrl: production.RENDER_EXTERNAL_URL, enableCron: false });
});
test('deployment refuses missing keys, sample secrets, localhost databases and non-HTTPS URLs', () => {
  for (const change of [
    { JWT_SECRET: '' }, { JWT_SECRET: 'slh_production_super_secret_jwt_key_2026' },
    { DATABASE_URL: '' }, { DATABASE_URL: 'postgresql://a:b@localhost/test' },
    { DATABASE_URL: 'https://example.com' }, { FRONTEND_URL: 'http://localhost:5173' },
  ]) expect(() => deploymentConfig({ ...production, ...change })).toThrow();
});
