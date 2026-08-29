const express = require('express');
const router = express.Router();
const xacThuc = require('../../middlewares/auth.middleware');
const {
  themDeadline,
  layDanhSachDeadline,
  suaDeadline,
  hoanThanhDeadline,
  xoaDeadline,
  deadlineSapToi,
} = require('./deadline.controller');

router.use(xacThuc);

router.post('/', themDeadline);
router.get('/', layDanhSachDeadline);
router.put('/:id', suaDeadline);
router.patch('/:id/hoan-thanh', hoanThanhDeadline);
router.delete('/:id', xoaDeadline);
router.get('/sap-toi', deadlineSapToi);

module.exports = router;
