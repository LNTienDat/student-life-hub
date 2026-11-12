import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import PasswordToggle from '../components/PasswordToggle';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, PiggyBank, Target } from 'lucide-react';
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

function Register() {
  useLanguage();
  const [hienXacNhan, setHienXacNhan] = useState(false);
  const [ten, setTen] = useState('');
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [loi, setLoi] = useState('');
  const [dangTai, setDangTai] = useState(false);

  const navigate = useNavigate();

  async function xuLySubmit(e) {
    e.preventDefault();
    setLoi('');

    if (matKhau !== xacNhanMatKhau) {
      setLoi('Mật khẩu xác nhận không khớp');
      return;
    }

    setDangTai(true);

    try {
      await api.post('/auth/dang-ky', { ten, email, matKhau });
      navigate('/login');
    } catch (error) {
      setLoi(error.response?.data?.message || 'Đã có lỗi xảy ra');
    } finally {
      setDangTai(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Panel thương hiệu — ẩn trên mobile, họa tiết dòng kẻ sổ tay + 3 lá ghi chú xếp chồng */}
      <div className="hidden lg:flex lg:w-[46%] relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 overflow-hidden flex-col justify-between p-8 shadow-2xl">
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
          >{tr("Bắt đầu hành trình kiểm soát cuộc sống sinh viên của bạn.")}</motion.h1>

          <div className="relative h-64 mt-8 max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 24, rotate: -10 }}
              animate={{ opacity: 1, y: 0, rotate: -8 }}
              transition={{ delay: 0.3, duration: 0.55, ease: 'easeOut' }}
              className="absolute top-0 left-0 w-52 bg-white rounded-xl shadow-lg p-4"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-medium text-amber-600">{tr("Mục tiêu học tập")}</span>
              </div>
              <p className="font-display text-[17px] font-bold text-amber-600 whitespace-nowrap">{tr("Học bổng xuất sắc")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24, rotate: 8 }}
              animate={{ opacity: 1, y: 0, rotate: 5 }}
              transition={{ delay: 0.42, duration: 0.55, ease: 'easeOut' }}
              className="absolute top-[76px] left-16 w-52 bg-white rounded-xl shadow-lg p-4"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <PiggyBank className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[11px] font-medium text-rose-600">{tr("Mục tiêu tài chính")}</span>
              </div>
              <p className="text-[15px] font-bold text-rose-600 whitespace-nowrap">{tr("Tiết kiệm 500k / tháng")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              transition={{ delay: 0.54, duration: 0.55, ease: 'easeOut' }}
              className="absolute top-[152px] left-4 w-52 bg-white rounded-xl shadow-xl p-4"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-medium text-emerald-600">{tr("Kỷ luật bản thân")}</span>
              </div>
              <p className="font-display text-lg font-bold text-emerald-600 whitespace-nowrap">{tr("Không trễ Deadline")}</p>
            </motion.div>
          </div>
        </div>

        
      </div>

      {/* Form đăng ký */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <motion.div initial="an" animate="hien" custom={0} variants={bienTheField}>
            <p className="lg:hidden text-sm text-slate-400 mb-1">Student Life Hub</p>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">{tr("Tạo tài khoản")}</h1>
            <p className="text-sm text-slate-600 mb-7">{tr("Đăng ký để đồng bộ toàn bộ việc học và chi tiêu.")}</p>
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
              <label htmlFor="register-name" className="block text-sm font-medium text-slate-600 mb-1">{tr("Họ tên")}</label>
              <input
                id="register-name"
                type="text"
                value={ten}
                onChange={(e) => setTen(e.target.value)}
                placeholder={tr("Nguyễn Văn A")}
                maxLength={30}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/40 focus:border-ink-500 transition"
                required
              />
            </motion.div>

            <motion.div custom={2} initial="an" animate="hien" variants={bienTheField}>
              <label htmlFor="register-email" className="block text-sm font-medium text-slate-600 mb-1">Email</label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/40 focus:border-ink-500 transition"
                required
              />
            </motion.div>

            <motion.div custom={3} initial="an" animate="hien" variants={bienTheField}>
              <label htmlFor="register-password" className="block text-sm font-medium text-slate-600 mb-1">{tr("Mật khẩu")}</label>
              <div className="relative">
                <input
                  id="register-password"
                  type={hienMatKhau ? 'text' : 'password'}
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  placeholder={tr("Tối thiểu 6 ký tự")}
                  minLength={6}
                  className="w-full border border-slate-300 rounded-lg pl-3 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/40 focus:border-ink-500 transition"
                  required
                />
                <PasswordToggle visible={hienMatKhau} onClick={() => setHienMatKhau(!hienMatKhau)} />
              </div>
            </motion.div>

            <motion.div custom={4} initial="an" animate="hien" variants={bienTheField}>
              <label htmlFor="register-confirm-password" className="block text-sm font-medium text-slate-600 mb-1">{tr("Xác nhận mật khẩu")}</label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  type={hienXacNhan ? 'text' : 'password'}
                  value={xacNhanMatKhau}
                  onChange={(e) => setXacNhanMatKhau(e.target.value)}
                  placeholder={tr("Nhập lại mật khẩu")}
                  minLength={6}
                  className="w-full border border-slate-300 rounded-lg pl-3 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/40 focus:border-ink-500 transition"
                  required
                />
              <PasswordToggle visible={hienXacNhan} onClick={() => setHienXacNhan(!hienXacNhan)} label={tr("xác nhận mật khẩu")} />
</div>
            </motion.div>

            <motion.div custom={5} initial="an" animate="hien" variants={bienTheField}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={dangTai}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-2.5 rounded-xl disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/25 active:scale-[0.98]"
              >
                {dangTai ? tr('Đang tạo tài khoản...') : tr('Đăng ký ngay')}
              </motion.button>
            </motion.div>
          </form>

          <motion.p
            custom={6}
            initial="an"
            animate="hien"
            variants={bienTheField}
            className="text-center text-sm text-slate-600 mt-6"
          >{tr("Đã có tài khoản?")}{' '}
            <Link to="/login" className="text-ink-600 hover:text-ink-700 font-medium">{tr("Đăng nhập")}</Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
}

export default Register;



