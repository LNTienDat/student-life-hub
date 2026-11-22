const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../../middlewares/auth.middleware');
const { taoKeHoachOnTap, luuKeHoachThanhDeadline } = require('./planner.controller');

router.use(auth);
router.use(rateLimit({ windowMs: 60_000, max: 20, message: { message: 'Bạn thao tác hơi nhanh, vui lòng đợi một lát.' } }));

router.post('/generate', taoKeHoachOnTap);
router.post('/apply-deadlines', luuKeHoachThanhDeadline);

module.exports = router;
