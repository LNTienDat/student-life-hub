const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../../middlewares/auth.middleware');
const service = require('./document.service');
const router = express.Router();
router.use(auth);
const uploadLimit = rateLimit({ windowMs: 5 * 60 * 1000, max: 8, standardHeaders: true, legacyHeaders: false, skip: () => process.env.NODE_ENV === 'test', message: { message: 'Bạn đã nhập nhiều tài liệu. Hãy thử lại sau ít phút.' } });
function handle(action) {
  return async (req, res) => {
    try { await action(req, res); }
    catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
      return res.status(503).json({ message: 'Chưa xử lý được kho tài liệu. Kiểm tra kết nối hoặc cấu hình cơ sở dữ liệu rồi thử lại.' });
    }
  };
}
router.param('id', (req, res, next, id) => {
  if (id === 'huong-dan-lifehub' || (/^[1-9]\d*$/.test(id) && Number(id) <= 2147483647)) return next();
  return res.status(400).json({ message: 'Mã tài liệu không hợp lệ.' });
});
router.get('/', handle(async (req, res) => res.json(await service.listDocuments(req.user.id))));
router.post('/', uploadLimit, handle(async (req, res) => res.status(201).json({ taiLieu: await service.addDocument(req.user.id, req.body) })));
router.get('/:id', handle(async (req, res) => res.json({ taiLieu: await service.readDocument(req.user.id, req.params.id) })));
router.delete('/:id', handle(async (req, res) => {
  if (req.params.id === 'huong-dan-lifehub') return res.status(400).json({ message: 'Hướng dẫn sản phẩm được quản lý cùng phiên bản LifeHub.' });
  await service.deleteDocument(req.user.id, req.params.id); return res.json({ message: 'Đã xóa tài liệu khỏi kho.' });
}));
module.exports = router;
