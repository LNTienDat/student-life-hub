import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, CalendarDays, Wallet, ArrowLeft, ShieldCheck, KeyRound, Cloud } from 'lucide-react';
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
              initial={{ opacity: 0, y: 24, rotate: -10 }}
              animate={{ opacity: 1, y: 0, rotate: -8 }}
              transition={{ delay: 0.3, duration: 0.55, ease: 'easeOut' }}
              className="absolute top-0 left-0 w-52 bg-white rounded-xl shadow-lg p-4"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-medium text-emerald-600">Bảo mật thông tin</span>
              </div>
              <p className="font-display text-[17px] font-bold text-emerald-600 whitespace-nowrap">Dữ liệu an toàn</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24, rotate: 8 }}
              animate={{ opacity: 1, y: 0, rotate: 5 }}
              transition={{ delay: 0.42, duration: 0.55, ease: 'easeOut' }}
              className="absolute top-[76px] left-16 w-52 bg-white rounded-xl shadow-lg p-4"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <KeyRound className="w-3.5 h-3.5 text-ink-500" />
                <span className="text-[11px] font-medium text-ink-600">Phục hồi tài khoản</span>
              </div>
              <p className="font-display text-[17px] font-bold text-ink-700 whitespace-nowrap">Link gửi qua Email</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              transition={{ delay: 0.54, duration: 0.55, ease: 'easeOut' }}
              className="absolute top-[152px] left-4 w-52 bg-white rounded-xl shadow-xl p-4"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <Cloud className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[11px] font-medium text-blue-600">Lưu trữ đám mây</span>
              </div>
              <p className="font-display text-[17px] font-bold text-blue-600 whitespace-nowrap">Không mất dữ liệu</p>
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



