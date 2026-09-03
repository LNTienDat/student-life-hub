import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Save, KeyRound, CheckCircle2, AlertCircle, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';

function Profile() {
  const { dangNhap } = useAuth();
  const [ten, setTen] = useState('');
  const [email, setEmail] = useState('');
  const [thongBao, setThongBao] = useState(null);

  // Đổi email
  const [hienFormEmail, setHienFormEmail] = useState(false);
  const [emailMoi, setEmailMoi] = useState('');
  const [matKhauXacNhan, setMatKhauXacNhan] = useState('');
  const [hienMKXacNhan, setHienMKXacNhan] = useState(false);
  const [thongBaoEmail, setThongBaoEmail] = useState(null);
  const [dangTaiEmail, setDangTaiEmail] = useState(false);

  // Đổi mật khẩu
  const [matKhauCu, setMatKhauCu] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [hienMKCu, setHienMKCu] = useState(false);
  const [hienMKMoi, setHienMKMoi] = useState(false);
  const [thongBaoMK, setThongBaoMK] = useState(null);
  
  const [dangTai, setDangTai] = useState(false);
  const [dangTaiMK, setDangTaiMK] = useState(false);

  useEffect(() => {
    async function tai() {
      try {
        const res = await api.get('/auth/ho-so');
        const u = res.data.user;
        setTen(u.ten || '');
        setEmail(u.email || '');
      } catch (error) {
        console.error(error);
      }
    }
    tai();
  }, []);

  async function xuLySuaHoSo(e) {
    e.preventDefault();
    setThongBao(null);
    setDangTai(true);
    try {
      const res = await api.put('/auth/ho-so', { ten });
      const token = localStorage.getItem('token');
      dangNhap(res.data.user, token);
      setThongBao({ loai: 'success', text: 'Cập nhật họ tên thành công!' });
    } catch (error) {
      setThongBao({ loai: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra' });
    } finally {
      setDangTai(false);
    }
  }

  async function xuLyDoiEmail(e) {
    e.preventDefault();
    setThongBaoEmail(null);

    if (!emailMoi || !matKhauXacNhan) {
      setThongBaoEmail({ loai: 'error', text: 'Vui lòng điền email mới và mật khẩu xác nhận.' });
      return;
    }

    setDangTaiEmail(true);
    try {
      const res = await api.put('/auth/doi-email', { emailMoi, matKhau: matKhauXacNhan });
      const token = localStorage.getItem('token');
      dangNhap(res.data.user, token);
      setEmail(res.data.user.email);
      setEmailMoi('');
      setMatKhauXacNhan('');
      setThongBaoEmail({ loai: 'success', text: 'Đổi email tài khoản thành công!' });
      setTimeout(() => {
        setHienFormEmail(false);
        setThongBaoEmail(null);
      }, 2000);
    } catch (error) {
      setThongBaoEmail({ loai: 'error', text: error.response?.data?.message || 'Đổi email thất bại' });
    } finally {
      setDangTaiEmail(false);
    }
  }

  async function xuLyDoiMatKhau(e) {
    e.preventDefault();
    setThongBaoMK(null);
    setDangTaiMK(true);
    try {
      await api.put('/auth/doi-mat-khau', { matKhauCu, matKhauMoi });
      setMatKhauCu('');
      setMatKhauMoi('');
      setThongBaoMK({ loai: 'success', text: 'Đổi mật khẩu thành công!' });
    } catch (error) {
      setThongBaoMK({ loai: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra' });
    } finally {
      setDangTaiMK(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Hồ sơ cá nhân
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Quản lý thông tin tài khoản và bảo mật của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Cột 1: Thông tin cá nhân */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 relative overflow-hidden flex flex-col h-full justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink-600 dark:bg-blue-500" />
          
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200">
                  Thông tin cá nhân
                </h2>
                <p className="text-xs text-slate-400">Tên hiển thị & Email đăng nhập</p>
              </div>
            </div>

            {thongBao && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm font-medium ${thongBao.loai === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                {thongBao.loai === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {thongBao.text}
              </div>
            )}

            <form onSubmit={xuLySuaHoSo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Họ tên</label>
                <input 
                  value={ten} 
                  onChange={(e) => setTen(e.target.value)} 
                  maxLength={30}
                  placeholder="Nhập họ và tên..."
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:focus:ring-blue-500/30 transition-shadow" 
                  required 
                />
              </div>

              <div className="pt-1">
                <button 
                  type="submit" 
                  disabled={dangTai}
                  className="w-full flex items-center justify-center gap-2 bg-ink-600 dark:bg-blue-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-ink-700 dark:hover:bg-blue-700 disabled:opacity-70 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {dangTai ? 'Đang lưu...' : 'Lưu họ tên'}
                </button>
              </div>
            </form>

            {/* Mục Email tài khoản */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50 space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Email tài khoản</label>
                <button
                  type="button"
                  onClick={() => { setHienFormEmail(!hienFormEmail); setThongBaoEmail(null); }}
                  className="text-xs font-semibold text-ink-600 dark:text-blue-400 hover:text-ink-700 dark:hover:text-blue-300 transition-colors"
                >
                  {hienFormEmail ? 'Hủy đổi email' : 'Đổi email'}
                </button>
              </div>

              <div className="relative">
                <input 
                  value={email} 
                  disabled
                  className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-medium rounded-xl pl-10 pr-4 py-2.5 text-sm cursor-not-allowed select-none" 
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>

              {/* Form đổi email kèm xác nhận mật khẩu */}
              {hienFormEmail && (
                <form onSubmit={xuLyDoiEmail} className="mt-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-200 dark:border-slate-700/50">
                    <ShieldCheck className="w-4 h-4 text-ink-600 dark:text-blue-400" />
                    <span>Xác thực bảo mật để đổi Email</span>
                  </div>

                  {thongBaoEmail && (
                    <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${thongBaoEmail.loai === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                      {thongBaoEmail.loai === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{thongBaoEmail.text}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email mới</label>
                    <input
                      type="email"
                      value={emailMoi}
                      onChange={(e) => setEmailMoi(e.target.value)}
                      placeholder="vidu@student.edu.vn"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:focus:ring-blue-500/30"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Mật khẩu hiện tại</label>
                    <div className="relative">
                      <input
                        type={hienMKXacNhan ? 'text' : 'password'}
                        value={matKhauXacNhan}
                        onChange={(e) => setMatKhauXacNhan(e.target.value)}
                        placeholder="Nhập mật khẩu để bảo vệ tài khoản"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:focus:ring-blue-500/30"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setHienMKXacNhan(!hienMKXacNhan)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {hienMKXacNhan ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={dangTaiEmail}
                      className="flex-1 bg-ink-600 dark:bg-blue-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-ink-700 dark:hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {dangTaiEmail ? 'Đang xác thực...' : 'Xác nhận đổi email'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHienFormEmail(false)}
                      className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Cột 2: Đổi mật khẩu */}
        <form onSubmit={xuLyDoiMatKhau} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 relative overflow-hidden flex flex-col h-full justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
          
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200">
                  Bảo mật & Mật khẩu
                </h2>
                <p className="text-xs text-slate-400">Thay đổi mật khẩu đăng nhập tài khoản</p>
              </div>
            </div>

            {thongBaoMK && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm font-medium ${thongBaoMK.loai === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                {thongBaoMK.loai === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {thongBaoMK.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input 
                    type={hienMKCu ? 'text' : 'password'}
                    value={matKhauCu} 
                    onChange={(e) => setMatKhauCu(e.target.value)} 
                    placeholder="Nhập mật khẩu đang dùng"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-shadow" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setHienMKCu(!hienMKCu)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    title={hienMKCu ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex={-1}
                  >
                    {hienMKCu ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                  <input 
                    type={hienMKMoi ? 'text' : 'password'}
                    value={matKhauMoi} 
                    onChange={(e) => setMatKhauMoi(e.target.value)} 
                    placeholder="Tối thiểu 6 ký tự"
                    minLength={6}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-shadow" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setHienMKMoi(!hienMKMoi)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    title={hienMKMoi ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    tabIndex={-1}
                  >
                    {hienMKMoi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
            <button 
              type="submit" 
              disabled={dangTaiMK}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-70 transition-colors shadow-sm"
            >
              <KeyRound className="w-4 h-4" />
              {dangTaiMK ? 'Đang cập nhật...' : 'Đổi mật khẩu mới'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default Profile;
