const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../../prismaClient');
const { guiEmailDatLaiMatKhau } = require('../../utils/email.util');
const { AUTH } = require('../../constants');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const validPassword = value => typeof value === 'string' && value.length >= AUTH.MIN_PASSWORD_LENGTH && Buffer.byteLength(value, 'utf8') <= 72;
const passwordMessage = `Mật khẩu cần ít nhất ${AUTH.MIN_PASSWORD_LENGTH} ký tự và tối đa 72 byte UTF-8`;

async function dangKy(req, res) {
  try {
    const { matKhau } = req.body;
    const ten = typeof req.body.ten === 'string' ? req.body.ten.trim() : '';
    // Chuẩn hóa email: bỏ khoảng trắng thừa + về chữ thường, tránh
    // "Test@Gmail.com" và "test@gmail.com" bị coi là 2 tài khoản khác nhau
    // trong khi thực tế cùng 1 hộp thư.
    const email = normalizeEmail(req.body.email);

    if (!email || !matKhau || !ten) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email, mật khẩu và họ tên' });
    }
    if (!REGEX_EMAIL.test(email)) {
      return res.status(400).json({ message: 'Email không đúng định dạng' });
    }
    if (!validPassword(matKhau)) {
      return res.status(400).json({ message: passwordMessage });
    }
    if (ten.length > AUTH.MAX_TEN_LENGTH) {
      return res.status(400).json({ message: `Họ tên không được vượt quá ${AUTH.MAX_TEN_LENGTH} ký tự` });
    }

    const tonTai = await prisma.nguoiDung.findUnique({ where: { email } });
    if (tonTai) return res.status(400).json({ message: 'Email đã tồn tại' });

    const matKhauMaHoa = await bcrypt.hash(matKhau, AUTH.SALT_ROUNDS);
    await prisma.nguoiDung.create({
      data: { email, matKhau: matKhauMaHoa, ten }
    });

    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Email này đã được sử dụng' });
    }
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Hash "rác" dùng để so sánh khi email không tồn tại — bcrypt.compare() vẫn
// Bước so sánh mật khẩu giả lập chạy đủ thời gian bằng hash rác trong constants.
async function dangNhap(req, res) {
  try {
    const { matKhau } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || typeof matKhau !== 'string' || !matKhau || Buffer.byteLength(matKhau, 'utf8') > 72) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ email và mật khẩu' });
    }

    const nguoiDung = await prisma.nguoiDung.findUnique({ where: { email } });
    const dungMatKhau = await bcrypt.compare(matKhau, nguoiDung ? nguoiDung.matKhau : AUTH.DUMMY_HASH);

    if (!nguoiDung || !dungMatKhau) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // Nhúng mốc thời gian đổi mật khẩu gần nhất vào token — nếu sau này mật
    // khẩu bị đổi (do người dùng chủ động hoặc do lộ tài khoản), mọi token
    // cấp trước đó sẽ tự động bị coi là hết hạn dù chữ ký JWT vẫn hợp lệ.
    const token = jwt.sign(
      { id: nguoiDung.id, matKhauDoiLuc: nguoiDung.matKhauDoiLuc.getTime() },
      process.env.JWT_SECRET,
      { expiresIn: AUTH.JWT_EXPIRY }
    );
    const { matKhau: _, resetPasswordToken: __, resetPasswordExpiry: ___, ...thongTin } = nguoiDung;

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
    const { matKhau: _, resetPasswordToken: __, resetPasswordExpiry: ___, ...thongTin } = nguoiDung;
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

    const limits = { ten: AUTH.MAX_TEN_LENGTH, truong: AUTH.MAX_TRUONG_LENGTH, nganh: AUTH.MAX_NGANH_LENGTH, khoaHoc: AUTH.MAX_KHOA_HOC_LENGTH, avatar: AUTH.MAX_AVATAR_LENGTH };
    for (const [field, max] of Object.entries(limits)) {
      const value = req.body[field];
      if (value !== undefined && (typeof value !== 'string' || value.length > max || (field === 'ten' && !value.trim()))) {
        return res.status(400).json({ message: `Thông tin hồ sơ không hợp lệ (tối đa ${max} ký tự)` });
      }
    }

    if (ten !== undefined && ten.length > AUTH.MAX_TEN_LENGTH) {
      return res.status(400).json({ message: `Họ tên không được vượt quá ${AUTH.MAX_TEN_LENGTH} ký tự` });
    }
    if (truong !== undefined && truong.length > AUTH.MAX_TRUONG_LENGTH) {
      return res.status(400).json({ message: `Tên trường không được vượt quá ${AUTH.MAX_TRUONG_LENGTH} ký tự` });
    }
    if (nganh !== undefined && nganh.length > AUTH.MAX_NGANH_LENGTH) {
      return res.status(400).json({ message: `Tên ngành không được vượt quá ${AUTH.MAX_NGANH_LENGTH} ký tự` });
    }
    if (khoaHoc !== undefined && khoaHoc.length > AUTH.MAX_KHOA_HOC_LENGTH) {
      return res.status(400).json({ message: `Khóa học không được vượt quá ${AUTH.MAX_KHOA_HOC_LENGTH} ký tự` });
    }
    if (avatar !== undefined && avatar.length > AUTH.MAX_AVATAR_LENGTH) {
      return res.status(400).json({ message: 'Đường dẫn avatar quá dài' });
    }

    const nguoiDung = await prisma.nguoiDung.update({
      where: { id: req.user.id },
      data: { ten: ten?.trim(), truong: truong?.trim(), nganh: nganh?.trim(), khoaHoc: khoaHoc?.trim(), avatar: avatar?.trim() },
    });
    const { matKhau: _, resetPasswordToken: __, resetPasswordExpiry: ___, ...thongTin } = nguoiDung;
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
    if (typeof matKhauCu !== 'string' || !matKhauCu || typeof matKhauMoi !== 'string') {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới' });
    }
    if (!validPassword(matKhauMoi)) {
      return res.status(400).json({ message: passwordMessage });
    }

    const nguoiDung = await prisma.nguoiDung.findUnique({ where: { id: req.user.id } });
    const dung = await bcrypt.compare(matKhauCu, nguoiDung.matKhau);
    if (!dung) {
      return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
    }

    const matKhauMaHoa = await bcrypt.hash(matKhauMoi, AUTH.SALT_ROUNDS);
    const thoiDiemDoi = new Date(Math.max(Date.now(), nguoiDung.matKhauDoiLuc.getTime() + 1));
    const changed = await prisma.nguoiDung.updateMany({
      where: { id: req.user.id, matKhau: nguoiDung.matKhau },
      data: { matKhau: matKhauMaHoa, matKhauDoiLuc: thoiDiemDoi, resetPasswordToken: null, resetPasswordExpiry: null },
    });
    if (!changed.count) return res.status(409).json({ message: 'Tài khoản vừa thay đổi. Vui lòng đăng nhập lại.' });

    // Cấp lại token mới cho chính phiên đổi mật khẩu này, để người dùng tiếp tục
    // sử dụng bình thường mà không bị middleware coi là phiên hết hạn.
    // Trong khi đó, toàn bộ token cũ ở các thiết bị khác vẫn bị vô hiệu hóa.
    const tokenMoi = jwt.sign(
      { id: nguoiDung.id, matKhauDoiLuc: thoiDiemDoi.getTime() },
      process.env.JWT_SECRET,
      { expiresIn: AUTH.JWT_EXPIRY }
    );

    res.json({ message: 'Đổi mật khẩu thành công', token: tokenMoi });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// Đổi email (yêu cầu mật khẩu xác thực)
async function doiEmail(req, res) {
  try {
    const matKhau = req.body.matKhau;
    const emailMoi = normalizeEmail(req.body.emailMoi);
    if (!emailMoi || typeof matKhau !== 'string' || !matKhau) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email mới và mật khẩu xác nhận' });
    }

    if (!REGEX_EMAIL.test(emailMoi)) {
      return res.status(400).json({ message: 'Định dạng email mới không hợp lệ' });
    }

    const nguoiDung = await prisma.nguoiDung.findUnique({ where: { id: req.user.id } });
    if (!nguoiDung) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const dung = await bcrypt.compare(matKhau, nguoiDung.matKhau);
    if (!dung) {
      return res.status(400).json({ message: 'Mật khẩu xác nhận không chính xác' });
    }

    if (emailMoi.toLowerCase() === nguoiDung.email.toLowerCase()) {
      return res.status(400).json({ message: 'Email mới phải khác email hiện tại' });
    }

    const daTonTai = await prisma.nguoiDung.findUnique({
      where: { email: emailMoi.toLowerCase() },
    });
    if (daTonTai) {
      return res.status(400).json({ message: 'Email này đã được sử dụng bởi tài khoản khác' });
    }

    const capNhat = await prisma.nguoiDung.update({
      where: { id: req.user.id },
      data: { email: emailMoi.toLowerCase(), resetPasswordToken: null, resetPasswordExpiry: null },
    });

    const { matKhau: _, resetPasswordToken: __, resetPasswordExpiry: ___, ...thongTin } = capNhat;
    res.json({ message: 'Đổi email thành công', user: thongTin });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Email này đã được sử dụng' });
    }
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// CN3 - Bước 1: Yêu cầu đặt lại mật khẩu
async function quenMatKhau(req, res) {
  try {
    if (!REGEX_EMAIL.test(normalizeEmail(req.body.email))) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }
    const email = normalizeEmail(req.body.email);

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
    const hetHan = new Date(Date.now() + AUTH.RESET_TOKEN_EXPIRY_MS);

    const issued = await prisma.nguoiDung.updateMany({
      where: { id: nguoiDung.id, email, matKhau: nguoiDung.matKhau },
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpiry: hetHan,
      },
    });
    if (!issued.count) return res.status(200).json(thongBaoChung);

    const resetLink = `${process.env.FRONTEND_URL}/dat-lai-mat-khau?token=${tokenGoc}&email=${encodeURIComponent(email)}`;
    try {
      await guiEmailDatLaiMatKhau(email, nguoiDung.ten, resetLink);
    } catch {
      await prisma.nguoiDung.updateMany({ where: { id: nguoiDung.id, resetPasswordToken: tokenHash }, data: { resetPasswordToken: null, resetPasswordExpiry: null } });
      return res.status(503).json({ message: 'Dịch vụ gửi email hiện chưa sẵn sàng. Vui lòng thử lại sau.' });
    }

    res.status(200).json(thongBaoChung);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

// CN3 - Bước 2: Đặt lại mật khẩu bằng token
async function datLaiMatKhau(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const { token, matKhauMoi } = req.body;

    if (!email || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || typeof matKhauMoi !== 'string') {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    if (!validPassword(matKhauMoi)) {
      return res.status(400).json({ message: passwordMessage });
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

    const matKhauMaHoa = await bcrypt.hash(matKhauMoi, AUTH.SALT_ROUNDS);
    const consumed = await prisma.nguoiDung.updateMany({
      where: { id: nguoiDung.id, email, resetPasswordToken: tokenHash, resetPasswordExpiry: { gt: new Date() }, matKhau: nguoiDung.matKhau },
      data: {
        matKhau: matKhauMaHoa,
        matKhauDoiLuc: new Date(Math.max(Date.now(), nguoiDung.matKhauDoiLuc.getTime() + 1)),
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    if (!consumed.count) return res.status(400).json({ message: 'Liên kết không hợp lệ hoặc đã được sử dụng' });
    res.status(200).json({ message: 'Đặt lại mật khẩu thành công, bạn có thể đăng nhập lại' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
}

module.exports = { dangKy, dangNhap, xemHoSo, suaHoSo, doiMatKhau, doiEmail, quenMatKhau, datLaiMatKhau };
