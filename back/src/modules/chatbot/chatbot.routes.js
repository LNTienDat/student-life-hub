const express = require('express');
const router = express.Router();
const xacThuc = require('../../middlewares/auth.middleware');
const { gioiHanChatbot } = require('../../middlewares/rateLimit.middleware');
const { guiTinNhan } = require('./chatbot.controller');

router.use(xacThuc);

router.post('/hoi-dap', gioiHanChatbot, guiTinNhan);

module.exports = router;
