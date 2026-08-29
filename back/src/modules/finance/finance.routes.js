const express = require('express');
const router = express.Router();
const xacThuc = require('../../middlewares/auth.middleware');
const {
  themGiaoDich,
  layDanhSachGiaoDich,
  suaGiaoDich,
  xoaGiaoDich,
  thongKeTheoThang,
  datNganSach,
  kiemTraNganSach,
  xuHuongNThang,
} = require('./finance.controller');

router.use(xacThuc);

router.post('/giao-dich', themGiaoDich);
router.get('/giao-dich', layDanhSachGiaoDich);
router.put('/giao-dich/:id', suaGiaoDich);
router.delete('/giao-dich/:id', xoaGiaoDich);

router.get('/thong-ke', thongKeTheoThang);

router.post('/ngan-sach', datNganSach);
router.get('/ngan-sach', kiemTraNganSach);

router.get('/xu-huong', xuHuongNThang);

module.exports = router;
