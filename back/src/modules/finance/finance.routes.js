const express = require('express');
const router = express.Router();
const { validateId } = require('../../utils/validation.util');
for (const key of ['id', 'idMonHoc', 'idDeadline', 'idThanhVien']) router.param(key, validateId);
const xacThuc = require('../../middlewares/auth.middleware');
const {
  themGiaoDich,
  layDanhSachGiaoDich,
  suaGiaoDich,
  xoaGiaoDich,
  thongKeTheoThang,
  datNganSach,
  xoaNganSach,
  kiemTraNganSach,
  xuHuongNThang,
  xuatBaoCaoTaiChinhExcel,
} = require('./finance.controller');

router.use(xacThuc);
const { layDanhMuc, themDanhMuc, xoaDanhMuc, suaDanhMuc } = require('./category.service');
router.get('/danh-muc', layDanhMuc);
router.post('/danh-muc', themDanhMuc);
router.put('/danh-muc/:ma', suaDanhMuc);
router.delete('/danh-muc/:ma', xoaDanhMuc);

router.post('/giao-dich', themGiaoDich);
router.get('/giao-dich', layDanhSachGiaoDich);
router.put('/giao-dich/:id', suaGiaoDich);
router.delete('/giao-dich/:id', xoaGiaoDich);

router.get('/thong-ke', thongKeTheoThang);

router.post('/ngan-sach', datNganSach);
router.get('/ngan-sach', kiemTraNganSach);
router.delete('/ngan-sach/:id', xoaNganSach);

router.get('/xu-huong', xuHuongNThang);
router.get('/xuat-bao-cao', xuatBaoCaoTaiChinhExcel);

module.exports = router;
