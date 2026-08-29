const express = require('express');
const router = express.Router();
const xacThuc = require('../../middlewares/auth.middleware');
const {
  themMonHoc,
  layDanhSachMonHoc,
  suaMonHoc,
  xoaMonHoc,
  themDiem,
  tinhGPA,
  duDoanDiem,
  canhBaoMonNguyCo,
  gpaTheoKy,
  xuatBangDiemPDF,
} = require('./academic.controller');

router.use(xacThuc);

router.post('/mon-hoc', themMonHoc);
router.get('/mon-hoc', layDanhSachMonHoc);
router.put('/mon-hoc/:id', suaMonHoc);
router.delete('/mon-hoc/:id', xoaMonHoc);
router.post('/diem', themDiem);
router.get('/gpa', tinhGPA);
router.post('/mon-hoc/:idMonHoc/du-doan', duDoanDiem);
router.get('/canh-bao', canhBaoMonNguyCo);
router.get('/gpa-theo-ky', gpaTheoKy);
router.get('/xuat-bang-diem', xuatBangDiemPDF);

module.exports = router;