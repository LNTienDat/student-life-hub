function deploymentConfig(env) {
  const serveFrontend = env.SERVE_FRONTEND === 'true';
  const frontendUrl = (env.FRONTEND_URL || env.RENDER_EXTERNAL_URL || 'http://localhost:5173').replace(/\/$/, '');
  if (env.NODE_ENV === 'production' && serveFrontend) {
    if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || ['your_secret_key_here', 'slh_production_super_secret_jwt_key_2026'].includes(env.JWT_SECRET)) {
      throw new Error('Cần JWT_SECRET ngẫu nhiên ít nhất 32 ký tự cho bản online.');
    }
    let database;
    try { database = new URL(env.DATABASE_URL); } catch { throw new Error('Cần DATABASE_URL của PostgreSQL online.'); }
    if (!['postgres:', 'postgresql:'].includes(database.protocol) || ['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) {
      throw new Error('DATABASE_URL bản online phải trỏ đến PostgreSQL hosting, không phải localhost.');
    }
    if (!frontendUrl.startsWith('https://')) throw new Error('Cần FRONTEND_URL HTTPS hoặc RENDER_EXTERNAL_URL để tạo liên kết ứng dụng.');
  }
  return { serveFrontend, frontendUrl, enableCron: env.ENABLE_CRON_JOBS !== 'false' };
}
module.exports = { deploymentConfig };
