const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../../prismaClient');
const { guiEmailDatLaiMatKhau } = require('../../utils/email.util');

async function dangKy(req, res) {
  try {
    const { email, matKhau, ten } = req.body;
    
    const tonTai = await prisma.nguoiDung.findUnique({ where: { email } });
    if (tonTai) return res.status(400).json({ message: 'Email đã tồn tại' });

    const matKhauMaHoa = await bcrypt.hash(matKhau, 10);
    const nguoiDung = await prisma.nguoiDung.create({
      data: { email, matKhau: matKhauMaHoa, ten }
    });

    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

async function dangNhap(req, res) {
  try {
    const { email, matKhau } = req.body;
    
    const nguoiDung = await prisma.nguoiDung.findUnique({ where: { email } });
    if (!nguoiDung) return res.status(400).json({ message: 'Email không đúng' });

    const dungMatKhau = await bcrypt.compare(matKhau, nguoiDung.matKhau);
    if (!dungMatKhau) return res.status(400).json({ message: 'Mật khẩu không đúng' });

    const token = jwt.sign({ id: nguoiDung.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { matKhau: _, ...thongTin } = nguoiDung;
    
    res.json({ token, user: thongTin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}
// Lấy thông tin hồ sơ hiện tại
async function xemHoSo(req, res) {
  try {
    const nguoiDung = await prisma.nguoiDung.findUnique({
      where: { id: req.user.id },
    });
    const { matKhau: _, ...thongTin } = nguoiDung;
    res.json({ user: thongTin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Cập nhật hồ sơ
async function suaHoSo(req, res) {
  try {
    const { ten, truong, nganh, khoaHoc, avatar } = req.body;
    const nguoiDung = await prisma.nguoiDung.update({
      where: { id: req.user.id },
      data: { ten, truong, nganh, khoaHoc, avatar },
    });
    const { matKhau: _, ...thongTin } = nguoiDung;
    res.json({ message: 'Cập nhật hồ sơ thành công', user: thongTin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Đổi mật khẩu
async function doiMatKhau(req, res) {
  try {
    const { matKhauCu, matKhauMoi } = req.body;
    if (!matKhauCu || !matKhauMoi) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới' });
    }

    const nguoiDung = await prisma.nguoiDung.findUnique({ where: { id: req.user.id } });
    const dung = await bcrypt.compare(matKhauCu, nguoiDung.matKhau);
    if (!dung) {
      return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
    }

    const matKhauMaHoa = await bcrypt.hash(matKhauMoi, 10);
    await prisma.nguoiDung.update({
      where: { id: req.user.id },
      data: { matKhau: matKhauMaHoa },
    });

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// CN3 - Bước 1: Yêu cầu đặt lại mật khẩu
async function quenMatKhau(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }

    const nguoiDung = await prisma.nguoiDung.findUnique({ where: { email } });

    // Luôn trả về cùng 1 thông báo dù email có tồn tại hay không (tránh lộ thông tin)
    const thongBaoChung = {
      message: 'Nếu email tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi.',
    };

    if (!nguoiDung) {
      return res.status(200).json(thongBaoChung);
    }

    const tokenGoc = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenGoc).digest('hex');
    const hetHan = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    await prisma.nguoiDung.update({
      where: { id: nguoiDung.id },
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpiry: hetHan,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/dat-lai-mat-khau?token=${tokenGoc}&email=${encodeURIComponent(email)}`;
    await guiEmailDatLaiMatKhau(email, nguoiDung.ten, resetLink);

    res.status(200).json(thongBaoChung);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// CN3 - Bước 2: Đặt lại mật khẩu bằng token
async function datLaiMatKhau(req, res) {
  try {
    const { email, token, matKhauMoi } = req.body;

    if (!email || !token || !matKhauMoi) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    if (matKhauMoi.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const nguoiDung = await prisma.nguoiDung.findUnique({ where: { email } });
    if (!nguoiDung || !nguoiDung.resetPasswordToken || !nguoiDung.resetPasswordExpiry) {
      return res.status(400).json({ message: 'Liên kết không hợp lệ hoặc đã hết hạn' });
    }
    if (nguoiDung.resetPasswordExpiry < new Date()) {
      return res.status(400).json({ message: 'Liên kết đã hết hạn, vui lòng yêu cầu lại' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (tokenHash !== nguoiDung.resetPasswordToken) {
      return res.status(400).json({ message: 'Liên kết không hợp lệ' });
    }

    const matKhauMaHoa = await bcrypt.hash(matKhauMoi, 10);
    await prisma.nguoiDung.update({
      where: { id: nguoiDung.id },
      data: {
        matKhau: matKhauMaHoa,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công, bạn có thể đăng nhập lại' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

module.exports = { dangKy, dangNhap, xemHoSo, suaHoSo, doiMatKhau, quenMatKhau, datLaiMatKhau };
