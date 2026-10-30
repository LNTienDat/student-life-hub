const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../constants');

const isHealth = req => ['GET', 'HEAD'].includes(req.method) && req.path === '/health';

function limited(req, res) {
  const retryAfterSeconds = Math.max(1, Number(res.getHeader('Retry-After')) || Math.ceil(((req.rateLimit?.resetTime?.getTime() || Date.now() + 60000) - Date.now()) / 1000));
  const delay = retryAfterSeconds < 60 ? retryAfterSeconds + ' giây' : Math.ceil(retryAfterSeconds / 60) + ' phút';
  res.status(429).json({ code: 'RATE_LIMITED', retryAfterSeconds, message: 'Máy chủ đang tạm giới hạn yêu cầu. Bạn thử lại sau khoảng ' + delay + '.' });
}

function createApiLimiter({ environment = process.env.NODE_ENV, limit, windowMs = RATE_LIMIT.GLOBAL_WINDOW_MS } = {}) {
  return rateLimit({
    windowMs,
    limit: limit ?? (environment === 'development' ? RATE_LIMIT.DEV_GLOBAL_MAX : RATE_LIMIT.GLOBAL_MAX),
    skip: req => req.method === 'OPTIONS' || isHealth(req),
    standardHeaders: true, legacyHeaders: false, handler: limited,
  });
}

function createHealthLimiter({ limit = RATE_LIMIT.HEALTH_MAX, windowMs = RATE_LIMIT.HEALTH_WINDOW_MS } = {}) {
  return rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, handler: limited });
}
module.exports = { createApiLimiter, createHealthLimiter };
