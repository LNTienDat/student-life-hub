const express = require('express');
const router = express.Router();
const { validateId } = require('../../utils/validation.util');
for (const key of ['id', 'idMonHoc', 'idDeadline', 'idThanhVien']) router.param(key, validateId);
const xacThuc = require('../../middlewares/auth.middleware');
const {
  themBuoiHoc,
  layThoiKhoaBieu,
  suaBuoiHoc,
  xoaBuoiHoc,
  batChiaSeTKB,
  tatChiaSeTKB,
  layTrangThaiChiaSe,
  xemTKBChiaSe,
} = require('./thoikhoabieu.controller');

// PUBLIC: Không cần auth để xem TKB chia sẻ
router.get('/share/public/:token', xemTKBChiaSe);

// Các route bên dưới đều cần đăng nhập
router.use(xacThuc);

router.post('/share/bat', batChiaSeTKB);
router.post('/share/tat', tatChiaSeTKB);
router.get('/share/trang-thai', layTrangThaiChiaSe);

router.post('/', themBuoiHoc);
router.get('/', layThoiKhoaBieu);
router.put('/:id', suaBuoiHoc);
router.delete('/:id', xoaBuoiHoc);

module.exports = router;
