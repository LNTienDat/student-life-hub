import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import PasswordToggle from '../components/PasswordToggle';
import ModalDialog from '../components/ModalDialog';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Save, KeyRound, CheckCircle2, AlertCircle, Mail, LogOut, MessageSquarePlus, ShieldCheck, Send } from 'lucide-react';
import ProfileIdentity from './profile/ProfileIdentity';

function Profile() {
  useLanguage();
  const { dangNhap, dangXuat, user, capNhatUser } = useAuth();
  const navigate = useNavigate();
  const saveLock = useRef(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [retry, setRetry] = useState(0);
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

  // Góp ý & Báo lỗi
  const [loaiGopY, setLoaiGopY] = useState('gop_y');
  const [tieuDeGopY, setTieuDeGopY] = useState('');
  const [noiDungGopY, setNoiDungGopY] = useState('');
  const [dangGuiGopY, setDangGuiGopY] = useState(false);
  const [thongBaoGopY, setThongBaoGopY] = useState(null);

  async function xuLyGuiGopY(e) {
    e.preventDefault();
    setThongBaoGopY(null);
    if (tieuDeGopY.trim().length < 3 || noiDungGopY.trim().length < 10) {
      setThongBaoGopY({ loai: 'error', text: 'Tiêu đề cần ít nhất 3 ký tự và nội dung ít nhất 10 ký tự.' });
      return;
    }
    setDangGuiGopY(true);
    try {
      const res = await api.post('/feedback', {
        loai: loaiGopY,
        tieuDe: tieuDeGopY.trim(),
        noiDung: noiDungGopY.trim(),
        trang: '/ho-so',
      });
      setTieuDeGopY('');
      setNoiDungGopY('');
      setThongBaoGopY({ loai: 'success', text: res.data?.message || 'Cảm ơn bạn đã gửi góp ý!' });
    } catch (error) {
      setThongBaoGopY({ loai: 'error', text: error.response?.data?.message || 'Chưa gửi được phản hồi. Hãy thử lại sau.' });
    } finally {
      setDangGuiGopY(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function tai() {
      try {
        const res = await api.get('/auth/ho-so');
        if (!active) return;
        const u = res.data?.user || {};
        setTen(u.ten || '');
        setEmail(u.email || '');
        if (u.id) capNhatUser(u);
      } catch (error) {
        if (active) setProfileError(error.response?.data?.message || 'Chưa tải được hồ sơ');
      } finally { if (active) setProfileLoading(false); }
    }
    tai();
    return () => { active = false; };
  }, [retry, capNhatUser]);

  async function xuLySuaHoSo(e) {
    e.preventDefault();
    setThongBao(null);
    if (saveLock.current) return;
    saveLock.current = true;
    setDangTai(true);
    try {
      const res = await api.put('/auth/ho-so', { ten });
      const token = localStorage.getItem('token');
      dangNhap(res.data.user, token);
      setThongBao({ loai: 'success', text: 'Cập nhật họ tên thành công!' });
    } catch (error) {
      setThongBao({ loai: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra' });
    } finally {
      saveLock.current = false;
      setDangTai(false);
    }
  }

  function datTrangThaiDoiEmail(open) {
    setHienFormEmail(open);
    setEmailMoi('');
    setMatKhauXacNhan('');
    setHienMKXacNhan(false);
    setThongBaoEmail(null);
  }

  async function xuLyDoiEmail(e) {
    e.preventDefault();
    setThongBaoEmail(null);

    if (!emailMoi.trim() || !matKhauXacNhan) {
      setThongBaoEmail('Vui lòng điền email mới và mật khẩu xác nhận.');
      return;
    }

    if (saveLock.current) return;
    saveLock.current = true;
    setDangTaiEmail(true);
    try {
      const res = await api.put('/auth/doi-email', { emailMoi, matKhau: matKhauXacNhan });
      const token = localStorage.getItem('token');
      dangNhap(res.data.user, token);
      setEmail(res.data?.user?.email);
      datTrangThaiDoiEmail(false);
      setThongBao({ loai: 'success', text: 'Đổi email tài khoản thành công!' });
    } catch (error) {
      setMatKhauXacNhan('');
      setHienMKXacNhan(false);
      setThongBaoEmail(error.response?.data?.message || 'Đổi email thất bại');
    } finally {
      saveLock.current = false;
      setDangTaiEmail(false);
    }
  }

  async function xuLyDoiMatKhau(e) {
    e.preventDefault();
    setThongBaoMK(null);
    if (saveLock.current) return;
    saveLock.current = true;
    setDangTaiMK(true);
    try {
      const res = await api.put('/auth/doi-mat-khau', { matKhauCu, matKhauMoi });
      if (res.data.token) {
        dangNhap(user, res.data.token);
      }
      setMatKhauCu('');
      setMatKhauMoi('');
      setThongBaoMK({ loai: 'success', text: 'Đổi mật khẩu thành công!' });
    } catch (error) {
      setThongBaoMK({ loai: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra' });
    } finally {
      saveLock.current = false;
      setDangTaiMK(false);
    }
  }

  if (profileLoading) return <p role="status" className="p-6">{tr("Đang tải hồ sơ…")}</p>;
  if (profileError) return <div role="alert" className="p-6"><p>{tr(profileError)}</p><button type="button" className="mt-3 font-semibold text-ink-600" onClick={() => { setProfileError(''); setProfileLoading(true); setRetry(n => n + 1); }}>{tr("Thử tải lại")}</button></div>;

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-300">
            <User className="w-5 h-5" />
          </span>
          <span>{tr("Hồ sơ")}</span>
        </h1>
        <button type="button" onClick={() => { dangXuat(); navigate('/login', { replace: true }); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-400/30 dark:text-rose-300 dark:hover:bg-rose-500/10"><LogOut aria-hidden="true" className="h-4 w-4" />{tr('Đăng xuất')}</button>
      </div>

      <ProfileIdentity />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cột 1: Thông tin tài khoản */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 relative overflow-hidden flex flex-col h-full justify-between">

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-ink-50 dark:bg-ink-500/20 text-ink-600 dark:text-ink-300 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200">{tr("Thông tin tài khoản")}</h2>
              </div>
            </div>

            {thongBao && (
              <div role={thongBao.loai === 'success' ? 'status' : 'alert'} className={`mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${thongBao.loai === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                {thongBao.loai === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {tr(thongBao.text)}
              </div>
            )}

            <form onSubmit={xuLySuaHoSo} className="space-y-4">
              <div>
                <label htmlFor="profile-name" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Họ tên")}</label>
                <input
                  id="profile-name"
                  value={ten}
                  onChange={(e) => setTen(e.target.value)}
                  maxLength={100}
                  placeholder={tr("Nhập họ và tên...")}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:focus:ring-ink-500/30 transition-shadow"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="profile-email" className="block text-sm font-medium text-slate-600 dark:text-slate-400">{tr("Email tài khoản")}</label>
                  <button
                    type="button"
                    onClick={() => datTrangThaiDoiEmail(true)}
                    disabled={dangTai}
                    aria-haspopup="dialog"
                    className="text-sm font-semibold text-ink-600 hover:underline disabled:opacity-50 dark:text-ink-300"
                  >
                    {tr('Đổi email')}
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="profile-email"
                    value={email}
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-medium rounded-xl pl-10 pr-4 py-2.5 text-sm cursor-not-allowed select-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>
              <div className="pt-1">
                <button type="submit" disabled={dangTai} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink-600 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-ink-700 disabled:opacity-70 dark:bg-ink-500 dark:hover:bg-ink-400">
                  <Save aria-hidden="true" className="h-4 w-4" />
                  {dangTai ? tr('Đang lưu...') : tr('Lưu')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Cột 2: Đổi mật khẩu */}
        <form onSubmit={xuLyDoiMatKhau} className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 relative overflow-hidden flex flex-col h-full justify-between">

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200">{tr("Đổi mật khẩu")}</h2>
              </div>
            </div>

            {thongBaoMK && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm font-medium ${thongBaoMK.loai === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                {thongBaoMK.loai === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {tr(thongBaoMK.text)}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="profile-current-password" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Mật khẩu hiện tại")}</label>
                <div className="relative">
                  <input
                    id="profile-current-password"
                    type={hienMKCu ? 'text' : 'password'}
                    value={matKhauCu}
                    onChange={(e) => setMatKhauCu(e.target.value)}
                    placeholder={tr("Nhập mật khẩu đang dùng")}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-shadow"
                    required
                  />
                  <PasswordToggle visible={hienMKCu} onClick={() => setHienMKCu(!hienMKCu)} />
                </div>
              </div>

              <div>
                <label htmlFor="profile-new-password" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Mật khẩu mới")}</label>
                <div className="relative">
                  <input
                    id="profile-new-password"
                    type={hienMKMoi ? 'text' : 'password'}
                    value={matKhauMoi}
                    onChange={(e) => setMatKhauMoi(e.target.value)}
                    placeholder={tr("Tối thiểu 6 ký tự")}
                    minLength={6}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-shadow"
                    required
                  />
                  <PasswordToggle visible={hienMKMoi} onClick={() => setHienMKMoi(!hienMKMoi)} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <button
              type="submit"
              disabled={dangTaiMK}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-slate-900 disabled:opacity-70 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <KeyRound className="w-4 h-4" />
              {dangTaiMK ? tr('Đang cập nhật...') : tr('Đổi mật khẩu')}
            </button>
          </div>
        </form>

      </div>

      {/* Góp ý & Chính sách sản phẩm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={xuLyGuiGopY} className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between gap-4 h-full">
          <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200">{tr("Góp ý & Báo lỗi")}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{tr("Giúp chúng tôi hoàn thiện độ chính xác OCR và trải nghiệm sản phẩm.")}</p>
            </div>
          </div>

          {thongBaoGopY && (
            <div role={thongBaoGopY.loai === 'error' ? 'alert' : 'status'} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${thongBaoGopY.loai === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
              {thongBaoGopY.loai === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{tr(thongBaoGopY.text)}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="feedback-type" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Phân loại")}</label>
              <select id="feedback-type" value={loaiGopY} onChange={(e) => setLoaiGopY(e.target.value)} disabled={dangGuiGopY} className="min-h-11 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm">
                <option value="gop_y">{tr("Góp ý tính năng")}</option>
                <option value="loi">{tr("Báo lỗi ứng dụng")}</option>
                <option value="ocr">{tr("Lỗi nhận diện ảnh (OCR)")}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="feedback-title" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Tiêu đề")}</label>
              <input id="feedback-title" type="text" value={tieuDeGopY} onChange={(e) => setTieuDeGopY(e.target.value)} disabled={dangGuiGopY} maxLength={120} required placeholder={tr("Ví dụ: Hóa đơn quán A chưa nhận đúng ngày")} className="min-h-11 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label htmlFor="feedback-content" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Chi tiết")}</label>
            <textarea id="feedback-content" rows={3} value={noiDungGopY} onChange={(e) => setNoiDungGopY(e.target.value)} disabled={dangGuiGopY} maxLength={2000} required placeholder={tr("Mô tả điều bạn gặp phải hoặc mong muốn cải thiện...")} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-sm" />
          </div>
          </div>

          <button type="submit" disabled={dangGuiGopY} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-70">
            <Send className="w-4 h-4" aria-hidden="true" />
            {dangGuiGopY ? tr('Đang gửi...') : tr('Gửi phản hồi')}
          </button>
        </form>

        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200">{tr("Quyền riêng tư & Điều khoản")}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{tr("Minh bạch cách lưu trữ dữ liệu và xử lý AI/OCR")}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {tr("Mặc định quét ảnh chạy trên máy bạn. Ảnh hoặc nội dung tài liệu chỉ gửi tới Google Gemini khi bạn chủ động bấm nút AI Vision hoặc bật Trợ lý AI.")}
            </p>
          </div>
          <Link to="/chinh-sach" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:bg-slate-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            {tr("Xem Chính sách bảo mật & Điều khoản")}
          </Link>
        </div>
      </div>

      <ModalDialog open={hienFormEmail} onClose={() => datTrangThaiDoiEmail(false)} busy={dangTaiEmail} title="Đổi email">
        <form onSubmit={xuLyDoiEmail} autoComplete="off" className="space-y-4">
          {thongBaoEmail && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{tr(thongBaoEmail)}</p>}
          <div>
            <label htmlFor="profile-new-email" className="mb-1.5 block text-sm font-medium">{tr('Email mới')}</label>
            <input id="profile-new-email" type="email" autoComplete="off" value={emailMoi} onChange={(e) => setEmailMoi(e.target.value)} disabled={dangTaiEmail} required className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-900/50" />
          </div>
          <div>
            <label htmlFor="profile-confirm-password" className="mb-1.5 block text-sm font-medium">{tr('Mật khẩu hiện tại')}</label>
            <div className="relative">
              <input id="profile-confirm-password" type={hienMKXacNhan ? 'text' : 'password'} autoComplete="new-password" value={matKhauXacNhan} onChange={(e) => setMatKhauXacNhan(e.target.value)} disabled={dangTaiEmail} required className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-4 pr-12 text-sm dark:border-slate-600 dark:bg-slate-900/50" />
              <PasswordToggle visible={hienMKXacNhan} onClick={() => setHienMKXacNhan(visible => !visible)} disabled={dangTaiEmail} />
            </div>
          </div>
          <button type="submit" disabled={dangTaiEmail || !emailMoi.trim() || !matKhauXacNhan} className="min-h-11 w-full rounded-xl bg-ink-600 px-4 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-50 dark:bg-ink-500 dark:hover:bg-ink-400">
            {dangTaiEmail ? tr('Đang xác thực...') : tr('Xác nhận đổi email')}
          </button>
        </form>
      </ModalDialog>
    </div>
  );
}

export default Profile;
