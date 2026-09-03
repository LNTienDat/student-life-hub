import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, CalendarDays, Wallet } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import NotebookLines from '../components/NotebookLines';

const bienTheField = {
  an: { opacity: 0, y: 12 },
  hien: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

function Login() {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loi, setLoi] = useState('');
  const [dangTai, setDangTai] = useState(false);

  const navigate = useNavigate();
  const { dangNhap } = useAuth();

  async function xuLySubmit(e) {
    e.preventDefault();
    setLoi('');
    setDangTai(true);

    try {
      const res = await api.post('/auth/dang-nhap', { email, matKhau });
      dangNhap(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (error) {
      setLoi(error.response?.data?.message || 'Đã có lỗi xảy ra');
    } finally {
      setDangTai(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Panel thương hiệu — ẩn trên mobile, họa tiết dòng kẻ sổ tay + 3 lá ghi chú xếp chồng */}
      <div className="hidden lg:flex lg:w-[46%] relative bg-ink-600 overflow-hidden flex-col justify-between p-12">
        <NotebookLines className="absolute inset-0 w-full h-full opacity-60" />

        <div className="relative z-10">
          <span className="font-display text-lg font-bold text-white">Student Life Hub</span>
        </div>

        <div className="relative z-10 my-auto py-16">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="font-display text-3xl font-bold text-white leading-snug max-w-sm"
          >
            Deadline, điểm số và tiền bạc — gọn trong một trang sổ.
          </motion.h1>

          {/* 3 lá ghi chú xếp tầng — hình minh họa gắn trực tiếp với 3 trụ cột của app.
              Khoảng lệch được tính để phần chữ không bao giờ bị thẻ trên đè lên. */}
          <div className="relative h-64 mt-14 max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 24, rotate: -10 }}
              animate={{ opacity: 1, y: 0, rotate: -8 }}
              transition={{ delay: 0.3, duration: 0.55, ease: 'easeOut' }}
              className="absolute top-0 left-0 w-52 bg-white rounded-xl shadow-lg p-4"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <Wallet className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Số dư tháng này</span>
              </div>
              <p className="font-display text-xl font-bold text-teal-600 whitespace-nowrap">850.000 đ</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24, rotate: 8 }}
              animate={{ opacity: 1, y: 0, rotate: 5 }}
              transition={{ delay: 0.42, duration: 0.55, ease: 'easeOut' }}
              className="absolute top-[76px] left-16 w-52 bg-white rounded-xl shadow-lg p-4"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Deadline gần nhất</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">Đồ án — còn 2 ngày</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              transition={{ delay: 0.54, duration: 0.55, ease: 'easeOut' }}
              className="absolute top-[152px] left-4 w-52 bg-white rounded-xl shadow-xl p-4"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">GPA hiện tại</span>
              </div>
              <p className="font-display text-xl font-bold text-ink-600 whitespace-nowrap">3.42 / 4.0</p>
            </motion.div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/50">© 2026 Student Life Hub</p>
      </div>

      {/* Form đăng nhập */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <motion.div initial="an" animate="hien" custom={0} variants={bienTheField}>
            <p className="lg:hidden text-sm text-slate-400 mb-1">Student Life Hub</p>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Chào bạn quay lại</h1>
            <p className="text-sm text-slate-500 mb-7">Đăng nhập để tiếp tục theo dõi việc học.</p>
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

          <form onSubmit={xuLySubmit} className="space-y-4">
            <motion.div custom={1} initial="an" animate="hien" variants={bienTheField}>
              <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/40 focus:border-ink-500 transition"
                required
              />
            </motion.div>

            <motion.div custom={2} initial="an" animate="hien" variants={bienTheField}>
              <div className="flex items-baseline justify-between mb-1">
                <label className="block text-sm font-medium text-slate-600">Mật khẩu</label>
                <Link to="/quen-mat-khau" className="text-xs text-ink-600 hover:text-ink-700">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                type="password"
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
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
                {dangTai ? 'Đang xử lý...' : 'Đăng nhập'}
              </motion.button>
            </motion.div>
          </form>

          <motion.p
            custom={4}
            initial="an"
            animate="hien"
            variants={bienTheField}
            className="text-center text-sm text-slate-500 mt-6"
          >
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-ink-600 hover:text-ink-700 font-medium">
              Đăng ký ngay
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
}

export default Login;
