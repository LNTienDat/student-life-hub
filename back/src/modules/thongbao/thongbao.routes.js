const express = require('express');
const router = express.Router();
const xacThuc = require('../../middlewares/auth.middleware');
const { gioiHanTestCron } = require('../../middlewares/rateLimit.middleware');
const { layThongBao, testCronDeadline, testCronNganSach } = require('./thongbao.controller');

router.use(xacThuc);

router.get('/', layThongBao);
router.post('/test-cron/deadline', gioiHanTestCron, testCronDeadline);
router.post('/test-cron/ngan-sach', gioiHanTestCron, testCronNganSach);

module.exports = router;
