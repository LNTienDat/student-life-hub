const express = require('express');
const router = express.Router();
const xacThuc = require('../../middlewares/auth.middleware');
const { gioiHanDangNhap } = require('../../middlewares/rateLimit.middleware');
const { dangKy, dangNhap, xemHoSo, suaHoSo, doiMatKhau, doiEmail, quenMatKhau, datLaiMatKhau } = require('./auth.controller');

router.post('/dang-ky', gioiHanDangNhap, dangKy);
router.post('/dang-nhap', gioiHanDangNhap, dangNhap);
router.get('/ho-so', xacThuc, xemHoSo);
router.put('/ho-so', xacThuc, suaHoSo);
router.put('/doi-mat-khau', xacThuc, doiMatKhau);
router.put('/doi-email', xacThuc, doiEmail);
router.post('/quen-mat-khau', gioiHanDangNhap, quenMatKhau);
router.post('/dat-lai-mat-khau', gioiHanDangNhap, datLaiMatKhau);

module.exports = router;