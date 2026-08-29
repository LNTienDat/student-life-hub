const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../prismaClient');

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

module.exports = { dangKy, dangNhap, xemHoSo, suaHoSo, doiMatKhau };
