const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

async function xacThuc(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Nếu mật khẩu đã được đổi SAU thời điểm token này được cấp (dù chữ ký
    // JWT vẫn hợp lệ), coi như token đã hết hạn — bắt đăng nhập lại. Điều
    // này đảm bảo đổi mật khẩu thực sự "đuổi" được phiên đăng nhập cũ ra,
    // kể cả khi token đó bị lộ ra ngoài.
    const nguoiDung = await prisma.nguoiDung.findUnique({
      where: { id: decoded.id },
      select: { matKhauDoiLuc: true },
    });

    if (!nguoiDung) {
      return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    if (
      decoded.matKhauDoiLuc !== undefined &&
      nguoiDung.matKhauDoiLuc.getTime() > decoded.matKhauDoiLuc
    ) {
      return res.status(403).json({ message: 'Phiên đăng nhập đã hết hạn do mật khẩu vừa được đổi, vui lòng đăng nhập lại' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

module.exports = xacThuc;