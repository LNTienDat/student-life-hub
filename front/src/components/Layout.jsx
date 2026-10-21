import { useSemester } from '../hooks/useSemester';
import SemesterPicker from './SemesterPicker';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useDataRevision from '../hooks/useDataRevision';
import api from '../services/api';
import Chatbot from './Chatbot';
import GlowingNav from './GlowingNav';
import { Bell, Sun, Moon, Menu, X, LogOut, Clock, BookOpen, Wallet, AlertCircle } from 'lucide-react';

function Layout({ children }) {
  const [semester] = useSemester();
  const { user, dangXuat } = useAuth();
  const { theme, doiTheme } = useTheme();
  const revision = useDataRevision();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuMoMobile, setMenuMoMobile] = useState(false);
  const [deadlinesGap, setDeadlinesGap] = useState([]);
  const [bannerAn, setBannerAn] = useState(false);
  const [thongBaos, setThongBaos] = useState([]);
  const [notificationError, setNotificationError] = useState(false);
  const [chuongMo, setChuongMo] = useState(false);
  const notificationKey = `slh:notifications:${user?.id}`;
  const [daXemId, setDaXemId] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(notificationKey) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const chuongRef = useRef(null);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function refresh() {
      const [notifications, upcoming] = await Promise.allSettled([
        api.get('/thong-bao'), api.get('/deadline/sap-toi?soNgay=1'),
      ]);
      if (!active) return;
      setNotificationError(notifications.status === 'rejected');
      if (notifications.status === 'fulfilled') setThongBaos(notifications.value.data.thongBaos || []);
      if (upcoming.status === 'fulfilled') setDeadlinesGap(upcoming.value.data.deadlines || []);
    }
    refresh();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 5 * 60 * 1000);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [revision, user?.id]);

  useEffect(() => {
    function closeOutside(event) {
      if (!chuongRef.current?.contains(event.target) && !event.target.closest('.btn-chuong')) setChuongMo(false);
      if (!menuRef.current?.contains(event.target) && !menuButtonRef.current?.contains(event.target)) setMenuMoMobile(false);
    }
    function closeOnEscape(event) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (chuongMo) { setChuongMo(false); document.querySelector('.btn-chuong:not([hidden])')?.focus(); }
      if (menuMoMobile) { setMenuMoMobile(false); menuButtonRef.current?.focus(); }
    }
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('mousedown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, [chuongMo, menuMoMobile]);

  function xuLyDangXuat() { dangXuat(); navigate('/login'); }
  function remember(ids) {
    const next = [...new Set([...daXemId, ...ids])].slice(-500);
    setDaXemId(next);
    localStorage.setItem(notificationKey, JSON.stringify(next));
  }
  const soChuaXem = thongBaos.filter((item) => !daXemId.includes(item.id)).length;
  const menu = [
    { path: '/dashboard', label: 'Hôm nay' },
    { path: '/mon-hoc', label: 'Học tập' },
    { path: '/deadline', label: 'Deadline' },
    { path: '/thoi-khoa-bieu', label: 'Thời khóa biểu' },
    { path: '/nhom', label: 'Nhóm học' },
    { path: '/tai-chinh', label: 'Tài chính' },
    { path: '/ho-so', label: 'Hồ sơ' },
  ];
  const iconFor = (type) => type === 'deadline' ? <Clock className="h-4 w-4 text-amber-600" />
    : type === 'hoc_tap' ? <BookOpen className="h-4 w-4 text-ink-600" />
      : type === 'ngan_sach' ? <Wallet className="h-4 w-4 text-rose-600" /> : <Bell className="h-4 w-4" />;

  return <div className="app-shell min-h-screen bg-slate-50 dark:bg-slate-900">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-ink-600 focus:px-4 focus:py-3 focus:text-white">Chuyển đến nội dung chính</a>
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white dark:bg-slate-800">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" aria-label="LifeHub — trang Hôm nay" className="flex shrink-0 items-center gap-2" onClick={() => { setMenuMoMobile(false); setChuongMo(false); }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-600 text-white"><BookOpen aria-hidden="true" className="h-5 w-5" /></span>
          <span className="text-lg font-bold tracking-tight text-slate-900">LifeHub</span>
        </Link>
        <nav aria-label="Điều hướng chính" className="hidden min-w-0 lg:block"><GlowingNav menu={menu} /></nav>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => { setChuongMo(!chuongMo); setMenuMoMobile(false); }} className="btn-chuong shell-icon relative" aria-label={`Thông báo${soChuaXem ? ` (${soChuaXem} chưa đọc)` : ''}`} aria-expanded={chuongMo} aria-controls="notification-panel">
            <Bell aria-hidden="true" className="h-5 w-5" />
            {soChuaXem > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />}
          </button>
          <button type="button" onClick={doiTheme} className="shell-icon" aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}>{theme === 'dark' ? <Sun aria-hidden="true" className="h-5 w-5" /> : <Moon aria-hidden="true" className="h-5 w-5" />}</button>
          <Link to="/ho-so" title={user?.ten} aria-label={`Hồ sơ của ${user?.ten || 'bạn'}`} className="ml-2 hidden min-w-0 items-center gap-2 border-l border-slate-200 pl-3 lg:flex">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-50 text-sm font-semibold text-ink-600">{user?.ten?.charAt(0).toUpperCase()}</span>
            <span className="hidden max-w-24 truncate text-sm font-medium text-slate-700 xl:block">{user?.ten}</span>
          </Link>
          <button type="button" onClick={xuLyDangXuat} className="shell-icon hidden lg:inline-flex" aria-label="Đăng xuất khỏi tài khoản" title="Đăng xuất"><LogOut aria-hidden="true" className="h-4 w-4" /></button>
          <button ref={menuButtonRef} type="button" className="shell-icon lg:hidden" onClick={() => { setMenuMoMobile(!menuMoMobile); setChuongMo(false); }} aria-label={menuMoMobile ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'} aria-expanded={menuMoMobile} aria-controls="mobile-navigation">{menuMoMobile ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}</button>
        </div>
      </div>
      {menuMoMobile && <nav id="mobile-navigation" ref={menuRef} aria-label="Điều hướng trên điện thoại" className="absolute left-0 w-full border-b border-t border-slate-200 bg-white p-4 shadow-lg lg:hidden">
        <div className="grid grid-cols-2 gap-2">{menu.map(item => <Link key={item.path} to={item.path} onClick={() => setMenuMoMobile(false)} aria-current={location.pathname === item.path ? 'page' : undefined} className={`rounded-xl px-3 py-3 text-sm font-medium ${location.pathname === item.path ? 'bg-ink-50 text-ink-600' : 'text-slate-700 hover:bg-slate-50'}`}>{item.label}</Link>)}</div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3"><span className="min-w-0 truncate text-sm text-slate-600">{user?.ten}</span><button type="button" onClick={xuLyDangXuat} className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm text-rose-600"><LogOut className="h-4 w-4" />Đăng xuất</button></div>
      </nav>}
      {chuongMo && <section id="notification-panel" ref={chuongRef} aria-label="Thông báo" className="absolute right-4 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg sm:right-6">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">Thông báo ({soChuaXem})</h2><button type="button" className="shell-icon" onClick={() => setChuongMo(false)} aria-label="Đóng thông báo"><X className="h-4 w-4" /></button></div>
        {thongBaos.length > 0 && <button type="button" onClick={() => remember(thongBaos.map(item => item.id))} className="min-h-11 px-4 text-xs font-semibold text-ink-600">Đánh dấu tất cả đã đọc</button>}
        <div className="max-h-[60dvh] overflow-y-auto">
          {notificationError ? <p role="alert" className="p-5 text-sm text-rose-600">Chưa tải được thông báo. Kiểm tra kết nối rồi mở lại trang.</p>
            : thongBaos.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">Bạn chưa có thông báo mới.</p>
              : thongBaos.map(item => <button type="button" key={item.id} onClick={() => remember([item.id])} className={`flex w-full items-start gap-3 border-t border-slate-100 px-4 py-3 text-left ${!daXemId.includes(item.id) ? 'bg-ink-50' : 'hover:bg-slate-50'}`}>
                <span className="mt-0.5 shrink-0">{iconFor(item.loai)}</span><span className="min-w-0"><span className="block break-words text-sm font-semibold text-slate-800">{item.tieuDe}</span><span className="mt-1 block break-words text-xs leading-relaxed text-slate-500">{item.moTa}</span></span>
              </button>)}
        </div>
      </section>}
    </header>
    {deadlinesGap.length > 0 && !bannerAn && location.pathname !== '/dashboard' && <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800"><div className="mx-auto flex max-w-6xl items-center gap-3"><AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" /><Link to="/deadline" className="flex-1 underline underline-offset-2">{deadlinesGap.length} việc đến hạn trong 24 giờ tới. Xem deadline</Link><button type="button" onClick={() => setBannerAn(true)} className="min-h-11 min-w-11" aria-label="Đóng cảnh báo"><X className="mx-auto h-4 w-4" /></button></div></div>}
    <main id="main-content" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-7xl p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-24">
      <div key={`${location.pathname}:${semester}`}>
        {!['/tai-chinh', '/profile', '/ho-so'].includes(location.pathname) && <SemesterPicker />}
        {children || <Outlet />}
      </div>
    </main>
    <Chatbot />
  </div>;
}
export default Layout;
