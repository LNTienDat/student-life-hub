const express = require('express');
const router = express.Router();
const { validateId } = require('../../utils/validation.util');
for (const key of ['id', 'idMonHoc', 'idDeadline', 'idThanhVien']) router.param(key, validateId);
const xacThuc = require('../../middlewares/auth.middleware');
const nhomController = require('./nhom.controller');

// Tất cả route nhóm học tập đều yêu cầu đăng nhập
router.use(xacThuc);

// Nhóm
router.post('/tao', nhomController.taoNhom);
router.post('/tham-gia', nhomController.thamGiaNhom);
router.get('/', nhomController.layDanhSachNhom);
router.get('/:id', nhomController.layChiTietNhom);
router.put('/:id', nhomController.suaNhom);
router.delete('/:id', nhomController.xoaNhom);
router.delete('/:id/roi', nhomController.roiNhom);
router.delete('/:id/kick/:idThanhVien', nhomController.kickThanhVien);

// Deadline nhóm
router.post('/:id/deadline', nhomController.themDeadlineNhom);
router.put('/:id/deadline/:idDeadline', nhomController.suaDeadlineNhom);
router.delete('/:id/deadline/:idDeadline', nhomController.xoaDeadlineNhom);
router.put('/:id/deadline/:idDeadline/tien-do', nhomController.capNhatTienDo);

module.exports = router;
