const express = require('express');
const router = express.Router();
const xacThuc = require('../../middlewares/auth.middleware');
const { dangKy, dangNhap, xemHoSo, suaHoSo, doiMatKhau, quenMatKhau, datLaiMatKhau } = require('./auth.controller');

router.post('/dang-ky', dangKy);
router.post('/dang-nhap', dangNhap);
router.get('/ho-so', xacThuc, xemHoSo);
router.put('/ho-so', xacThuc, suaHoSo);
router.put('/doi-mat-khau', xacThuc, doiMatKhau);
router.post('/quen-mat-khau', quenMatKhau);
router.post('/dat-lai-mat-khau', datLaiMatKhau);

module.exports = router;