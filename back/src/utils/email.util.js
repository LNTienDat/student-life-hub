const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function guiEmail({ to, subject, html }) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
}

async function guiEmailDatLaiMatKhau(to, ten, resetLink) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#2563eb;">Student Life Hub</h2>
      <p>Xin chào <strong>${ten || ''}</strong>,</p>
      <p>Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản này.</p>
      <p>Nhấn vào nút bên dưới để đặt lại mật khẩu. Liên kết có hiệu lực trong <strong>15 phút</strong>.</p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="${resetLink}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Đặt lại mật khẩu
        </a>
      </p>
      <p>Nếu nút không hoạt động, hãy copy liên kết sau vào trình duyệt:</p>
      <p style="word-break:break-all;color:#2563eb;">${resetLink}</p>
      <p>Nếu bạn không yêu cầu điều này, hãy bỏ qua email này — mật khẩu của bạn sẽ không thay đổi.</p>
    </div>
  `;
  return guiEmail({ to, subject: 'Đặt lại mật khẩu - Student Life Hub', html });
}

module.exports = { guiEmail, guiEmailDatLaiMatKhau };
