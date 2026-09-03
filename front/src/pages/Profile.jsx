import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Save, KeyRound, CheckCircle2, AlertCircle, Mail, Eye, EyeOff } from 'lucide-react';

function Profile() {
  const { dangNhap } = useAuth();
  const [ten, setTen] = useState('');
  const [email, setEmail] = useState('');
  const [thongBao, setThongBao] = useState(null);

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
      setThongBao({ loai: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (error) {
      setThongBao({ loai: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra' });
    } finally {
      setDangTai(false);
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
        <form onSubmit={xuLySuaHoSo} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 relative overflow-hidden flex flex-col h-full justify-between">
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
                <p className="text-xs text-slate-400">Tên hiển thị trên toàn hệ thống</p>
              </div>
            </div>

            {thongBao && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm font-medium ${thongBao.loai === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                {thongBao.loai === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {thongBao.text}
              </div>
            )}

            <div className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email tài khoản</label>
                <div className="relative">
                  <input 
                    value={email} 
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-sm cursor-not-allowed select-none" 
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Email dùng để đăng nhập và không thể thay đổi trực tiếp.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
            <button 
              type="submit" 
              disabled={dangTai}
              className="w-full flex items-center justify-center gap-2 bg-ink-600 dark:bg-blue-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-ink-700 dark:hover:bg-blue-700 disabled:opacity-70 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              {dangTai ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>

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
