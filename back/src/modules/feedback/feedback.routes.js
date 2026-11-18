const fs = require('node:fs');
const path = require('node:path');
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../../middlewares/auth.middleware');
const { guiEmail, escapeHtml } = require('../../utils/email.util');

const LOG_DIR = path.resolve(__dirname, '../../../logs');
const LOG_FILE = path.join(LOG_DIR, 'feedback.jsonl');
const ALLOWED_TYPES = new Set(['loi', 'gop_y', 'ocr']);

function cleanField(value, maxLen) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

function validateFeedbackPayload(body = {}) {
  const loai = ALLOWED_TYPES.has(body?.loai) ? body.loai : 'gop_y';
  const tieuDe = cleanField(body?.tieuDe, 120);
  const noiDung = cleanField(body?.noiDung, 2000);
  const trang = cleanField(body?.trang, 120) || '/';

  if (tieuDe.length < 3) {
    return { error: 'Tiêu đề cần ít nhất 3 ký tự.' };
  }
  if (noiDung.length < 10) {
    return { error: 'Nội dung góp ý/báo lỗi cần ít nhất 10 ký tự.' };
  }
  return { data: { loai, tieuDe, noiDung, trang } };
}

router.use(auth);
router.use(rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn đã gửi quá nhiều phản hồi gần đây. Vui lòng thử lại sau ít phút.' },
}));

router.post('/', async (req, res) => {
  const { error, data } = validateFeedbackPayload(req.body);
  if (error) return res.status(400).json({ message: error });

  const entry = {
    ...data,
    userId: req.user?.id || null,
    userEmail: req.user?.email || '',
    createdAt: new Date().toISOString(),
  };

  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch {
    // Filesystems on ephemeral/read-only hosts may not persist local log files.
  }

  const recipient = process.env.FEEDBACK_EMAIL?.trim() || process.env.EMAIL_USER?.trim();
  const provider = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();
  if (recipient && provider !== 'mock' && provider !== 'log' && process.env.EMAIL_SIMULATE !== 'true') {
    try {
      await guiEmail({
        to: recipient,
        subject: `[LifeHub ${entry.loai.toUpperCase()}] ${entry.tieuDe}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px">
          <h3>Phản hồi mới từ Student Life Hub</h3>
          <p><strong>Loại:</strong> ${escapeHtml(entry.loai)}</p>
          <p><strong>Người gửi:</strong> ${escapeHtml(entry.userEmail || String(entry.userId || 'N/A'))}</p>
          <p><strong>Trang:</strong> ${escapeHtml(entry.trang)}</p>
          <p><strong>Nội dung:</strong></p>
          <pre style="white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px">${escapeHtml(entry.noiDung)}</pre>
        </div>`,
      });
    } catch {
      // Do not fail user feedback submission if admin notification mail fails.
    }
  }

  return res.status(201).json({
    message: 'Cảm ơn bạn đã gửi góp ý! Đội ngũ LifeHub đã ghi nhận.',
    createdAt: entry.createdAt,
  });
});

module.exports = router;
module.exports.validateFeedbackPayload = validateFeedbackPayload;
