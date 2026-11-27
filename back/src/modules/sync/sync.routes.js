const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../../middlewares/auth.middleware');
const { validateBody } = require('../../middlewares/validate.middleware');
const { sm2SyncSchema, edgeModelSyncSchema } = require('./sync.schemas');
const {
  getSm2Deck,
  putSm2Deck,
  deleteSm2Deck,
  getEdgeModel,
  putEdgeModel,
  deleteEdgeModel,
} = require('./sync.controller');

router.use(auth);
router.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    message: { message: 'Bạn đồng bộ hơi nhanh, vui lòng đợi một lát.' },
  }),
);

router.get('/sm2', getSm2Deck);
router.put('/sm2', validateBody(sm2SyncSchema), putSm2Deck);
router.delete('/sm2', deleteSm2Deck);

router.get('/edge-ai', getEdgeModel);
router.put('/edge-ai', validateBody(edgeModelSyncSchema), putEdgeModel);
router.delete('/edge-ai', deleteEdgeModel);

module.exports = router;
