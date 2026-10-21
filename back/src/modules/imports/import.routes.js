const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const prisma = require('../../prismaClient');
const auth = require('../../middlewares/auth.middleware');
const { parseUpload, checkExisting, commitImport } = require('./import.service');

router.use(auth);
router.use(rateLimit({ windowMs: 60_000, max: 15, message: { message: 'Vui lòng đợi một phút trước khi nhập tiếp.' } }));
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
