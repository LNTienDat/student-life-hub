const express = require('express');
const path = require('path');
const { existsSync } = require('fs');

function mountFrontend(app, distPath) {
  const index = path.join(distPath, 'index.html');
  if (!existsSync(index)) throw new Error('Chưa có bản dựng frontend. Cần chạy bước build trước khi mở bản online.');
  app.use(express.static(distPath, {
    dotfiles: 'deny',
    setHeaders(res, file) {
      const relative = path.relative(distPath, file).split(path.sep).join('/');
      if (relative === 'sw.js') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Service-Worker-Allowed', '/');
      } else if (relative.startsWith('assets/')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      else res.setHeader('Cache-Control', 'no-cache');
    },
  }));
  app.use((req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method) || req.path.startsWith('/api')
      || req.path.startsWith('/assets/') || req.path.startsWith('/icons/')
      || req.path.split('/').some((segment) => segment.startsWith('.'))
      || path.extname(req.path) || !req.accepts('html')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(index);
  });
}
module.exports = { mountFrontend };
