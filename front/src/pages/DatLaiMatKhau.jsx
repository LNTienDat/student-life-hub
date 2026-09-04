import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, CalendarDays, Wallet, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';
import api from '../services/api';
import NotebookLines from '../components/NotebookLines';

const bienTheField = {
  an: { opacity: 0, y: 12 },
  hien: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

function DatLaiMatKhau() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [loi, setLoi] = useState('');
  const [thongBao, setThongBao] = useState('');
  const [dangTai, setDangTai] = useState(false);

  async function xuLySubmit(e) {
    e.preventDefault();
    setLoi('');
    setThongBao('');

    if (!token || !email) {
      setLoi('Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại yêu cầu.');
      return;
    }
    if (matKhauMoi !== xacNhan) {
      setLoi('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setDangTai(true);
    try {
      const res = await api.post('/auth/dat-lai-mat-khau', { email, token, matKhauMoi });
      setThongBao(res.data.message || 'Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setLoi(error.response?.data?.message || 'Đã có lỗi xảy ra');
    } finally {
      setDangTai(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Panel thương hiệu — ẩn trên mobile, họa tiết dòng kẻ sổ tay + 3 lá ghi chú xếp chồng */}
      <div className="hidden lg:flex lg:w-[46%] relative bg-ink-600 overflow-hidden flex-col justify-between p-8">
        <NotebookLines className="absolute inset-0 w-full h-full opacity-60" />

        <div className="relative z-10">
          <span className="font-display text-lg font-bold text-white">Student Life Hub</span>
        </div>

        <div className="relative z-10 my-auto py-8">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="font-display text-3xl font-bold text-white leading-snug max-w-sm"
          >
            Đừng lo lắng, dữ liệu của bạn luôn được bảo vệ an toàn.
          </motion.h1>

          <div className="relative h-64 mt-8 max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 24, rotate: -5 }}
              animate={{ opacity: 1, y: 0, rotate: -3 }}
              transition={{ delay: 0.3, duration: 0.55, ease: 'easeOut' }}
              className="absolute top-4 left-8 w-60 bg-white rounded-xl shadow-lg p-5"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">Bảo mật tuyệt đối</span>
              </div>
              <p className="font-display text-lg font-bold text-emerald-700 whitespace-nowrap">Mã hóa dữ liệu 256-bit</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24, rotate: 6 }}
              animate={{ opacity: 1, y: 0, rotate: 4 }}
              transition={{ delay: 0.45, duration: 0.55, ease: 'easeOut' }}
              className="absolute top-[108px] left-12 w-60 bg-white rounded-xl shadow-xl p-5"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <KeyRound className="w-4 h-4 text-ink-500" />
                <span className="text-xs font-medium text-ink-600">Phục hồi dễ dàng</span>
              </div>
              <p className="font-display text-[17px] font-bold text-ink-700 whitespace-nowrap">Lấy lại quyền truy cập qua Email</p>
            </motion.div>
          </div>
        </div>

        
      </div>

      {/* Form đặt lại mật khẩu */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <motion.div initial="an" animate="hien" custom={0} variants={bienTheField}>
            <p className="lg:hidden text-sm text-slate-400 mb-1">Student Life Hub</p>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Đặt lại mật khẩu</h1>
            <p className="text-sm text-slate-600 mb-7">
              {email ? `Thiết lập mật khẩu mới cho ${email}` : 'Nhập mật khẩu mới cho tài khoản.'}
            </p>
          </motion.div>

          {loi && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg mb-4 text-sm overflow-hidden"
            >
              {loi}
            </motion.div>
          )}

          {thongBao && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2.5 rounded-lg mb-4 text-sm overflow-hidden"
            >
              {thongBao}
            </motion.div>
          )}

          <form onSubmit={xuLySubmit} className="space-y-4">
            <motion.div custom={1} initial="an" animate="hien" variants={bienTheField}>
              <label className="block text-sm font-medium text-slate-600 mb-1">Mật khẩu mới</label>
              <input
                type="password"
                value={matKhauMoi}
                onChange={(e) => setMatKhauMoi(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                minLength={6}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/40 focus:border-ink-500 transition"
                required
              />
            </motion.div>

            <motion.div custom={2} initial="an" animate="hien" variants={bienTheField}>
              <label className="block text-sm font-medium text-slate-600 mb-1">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={xacNhan}
                onChange={(e) => setXacNhan(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                minLength={6}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/40 focus:border-ink-500 transition"
                required
              />
            </motion.div>

            <motion.div custom={3} initial="an" animate="hien" variants={bienTheField}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={dangTai}
                className="w-full bg-ink-600 text-white font-medium py-2.5 rounded-lg hover:bg-ink-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {dangTai ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
              </motion.button>
            </motion.div>
          </form>

          <motion.div
            custom={4}
            initial="an"
            animate="hien"
            variants={bienTheField}
            className="text-center mt-6"
          >
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default DatLaiMatKhau;



