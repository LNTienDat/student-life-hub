import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Autocomplete from '../components/Autocomplete';
import { danhSachTruong, danhSachNganh } from '../data/truongNganh';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Save, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

function Profile() {
  const { dangNhap } = useAuth();
  const [ten, setTen] = useState('');
  const [truong, setTruong] = useState('');
  const [nganh, setNganh] = useState('');
  const [khoaHoc, setKhoaHoc] = useState('');
  const [thongBao, setThongBao] = useState(null);

  const [matKhauCu, setMatKhauCu] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [thongBaoMK, setThongBaoMK] = useState(null);
  
  const [dangTai, setDangTai] = useState(false);
  const [dangTaiMK, setDangTaiMK] = useState(false);

  useEffect(() => {
    async function tai() {
      try {
        const res = await api.get('/auth/ho-so');
        const u = res.data.user;
        setTen(u.ten || '');
        setTruong(u.truong || '');
        setNganh(u.nganh || '');
        setKhoaHoc(u.khoaHoc || '');
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
      const res = await api.put('/auth/ho-so', { ten, truong, nganh, khoaHoc });
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
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
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
          <form onSubmit={xuLySuaHoSo} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink-600 dark:bg-blue-500" />
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200">
                Thông tin cá nhân
              </h2>
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
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:focus:ring-blue-500/30 transition-shadow" 
                  required 
                />
              </div>
              <div className="relative z-20">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Trường đại học</label>
                <Autocomplete 
                  value={truong}
                  onChange={setTruong}
                  options={danhSachTruong}
                  placeholder="Nhập hoặc chọn trường..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative z-10">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Ngành học</label>
                  <Autocomplete 
                    value={nganh}
                    onChange={setNganh}
                    options={danhSachNganh}
                    placeholder="VD: Công nghệ thông tin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Khóa học (Năm)</label>
                  <input 
                    value={khoaHoc} 
                    onChange={(e) => setKhoaHoc(e.target.value)} 
                    placeholder="VD: K65 hoặc 2023-2027"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:focus:ring-blue-500/30 transition-shadow" 
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
              <button 
                type="submit" 
                disabled={dangTai}
                className="w-full flex items-center justify-center gap-2 bg-ink-600 dark:bg-blue-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-ink-700 dark:hover:bg-blue-700 disabled:opacity-70 transition-colors"
              >
                <Save className="w-4 h-4" />
                {dangTai ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>

          {/* Cột 2: Đổi mật khẩu */}
          <form onSubmit={xuLyDoiMatKhau} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200">
                Bảo mật & Mật khẩu
              </h2>
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
                <input 
                  type="password" 
                  value={matKhauCu} 
                  onChange={(e) => setMatKhauCu(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-shadow" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mật khẩu mới</label>
                <input 
                  type="password" 
                  value={matKhauMoi} 
                  onChange={(e) => setMatKhauMoi(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-shadow" 
                  required 
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
              <button 
                type="submit" 
                disabled={dangTaiMK}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-70 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                {dangTaiMK ? 'Đang cập nhật...' : 'Đổi mật khẩu mới'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </Layout>
  );
}

export default Profile;
