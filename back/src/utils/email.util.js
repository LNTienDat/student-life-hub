const nodemailer = require('nodemailer');

function emailError(code) {
  const error = new Error('Email delivery unavailable');
  error.code = code;
  return error;
}
async function guiEmail({ to, subject, html }) {
  const provider = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!from) throw emailError('EMAIL_CONFIG');
  if (provider === 'resend') {
    if (!process.env.RESEND_API_KEY) throw emailError('EMAIL_CONFIG');
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, html }),
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw emailError(response.status === 429 ? 'EMAIL_QUOTA' : 'EMAIL_PROVIDER');
      const data = await response.json();
      if (typeof data.id !== 'string' || !data.id) throw emailError('EMAIL_RESPONSE');
      return { messageId: data.id };
    } catch (error) {
      if (/^EMAIL_/.test(error.code || '')) throw error;
      throw emailError(error.name === 'TimeoutError' ? 'EMAIL_TIMEOUT' : 'EMAIL_PROVIDER');
    }
  }
  if (provider !== 'smtp' || !process.env.EMAIL_HOST) throw emailError('EMAIL_CONFIG');
  const port = Number(process.env.EMAIL_PORT || 587);
  // Render free blocks these SMTP ports; fail promptly instead of hanging.
  if (process.env.RENDER === 'true' && [25, 465, 587].includes(port)) throw emailError('EMAIL_SMTP_BLOCKED');
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, port, secure: port === 465,
    ...(process.env.EMAIL_USER ? { auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } } : {}),
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 12000,
  });
  try { return await transporter.sendMail({ from, to, subject, html }); }
  catch { throw emailError('EMAIL_SMTP'); }
  finally { transporter.close(); }
}
function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
async function guiEmailDatLaiMatKhau(to, ten, resetLink) {
  let url;
  try { url = new URL(resetLink); } catch { throw emailError('EMAIL_LINK'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw emailError('EMAIL_LINK');
  const link = escapeHtml(url.href);
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
    <h2>Student Life Hub</h2><p>Xin chào <strong>${escapeHtml(ten)}</strong>,</p>
    <p>Bạn vừa yêu cầu đặt lại mật khẩu. Liên kết có hiệu lực trong <strong>15 phút</strong>.</p>
    <p><a href="${link}">Đặt lại mật khẩu</a></p>
    <p>Nếu bạn không yêu cầu điều này, hãy bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.</p></div>`;
  return guiEmail({ to, subject: 'Đặt lại mật khẩu - Student Life Hub', html });
}
module.exports = { guiEmail, guiEmailDatLaiMatKhau, escapeHtml };
