const express = require('express');
const router = express.Router();
const xacThuc = require('../../middlewares/auth.middleware');
const {
  themBuoiHoc,
  layThoiKhoaBieu,
  suaBuoiHoc,
  xoaBuoiHoc,
} = require('./thoikhoabieu.controller');

router.use(xacThuc);

router.post('/', themBuoiHoc);
router.get('/', layThoiKhoaBieu);
router.put('/:id', suaBuoiHoc);
router.delete('/:id', xoaBuoiHoc);

module.exports = router;
