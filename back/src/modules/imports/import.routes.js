const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const prisma = require('../../prismaClient');
const auth = require('../../middlewares/auth.middleware');
const { cauHinhAI } = require('../chatbot/gemini.service');
const { parseUpload, checkExisting, commitImport } = require('./import.service');
const { extractWithVisionAI } = require('./visionOcr.service');

router.use(auth);
router.use(rateLimit({ windowMs: 60_000, max: 15, message: { message: 'Vui lòng đợi một phút trước khi nhập tiếp.' } }));

const visionLimiter = rateLimit({
  windowMs: 5 * 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn đã dùng quét AI hơi nhiều lần. Hãy đợi vài phút hoặc chỉnh tay.' },
});

router.get('/ocr-ai/status', (req, res) => {
  const { sanSang, model } = cauHinhAI();
  res.set('Cache-Control', 'no-store');
  res.json({ aiSanSang: sanSang, model });
});

router.post('/ocr-ai', visionLimiter, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    return res.json(await extractWithVisionAI(req.body));
  } catch (error) {
    return res.status(error.statusCode || 500).json({ code: error.code || 'OCR_AI_ERROR', message: error.message || 'Chưa quét được ảnh bằng AI.' });
  }
});

router.post('/preview', async (req, res) => {
  try { res.json(await checkExisting(prisma, req.user.id, await parseUpload(req.body))); }
  catch (error) { res.status(400).json({ message: error.message }); }
});
router.post('/commit', async (req, res) => {
  try { res.json(await commitImport(prisma, req.user.id, await parseUpload(req.body))); }
  catch (error) {
    if (error.code) { console.error(error); return res.status(503).json({ message: 'Chưa nhập được. Vui lòng thử lại.' }); }
    res.status(400).json({ message: error.message, preview: error.preview });
  }
});
module.exports = router;
