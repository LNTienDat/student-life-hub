import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import Chatbot from './Chatbot';
import GlowingNav from './GlowingNav';
import { 
  Bell, Sun, Moon, Menu, X, LogOut, 
  Clock, BookOpen, Wallet, AlertCircle 
} from 'lucide-react';

function Layout({ children }) {
  const { user, dangXuat } = useAuth();
  const { theme, doiTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuMoMobile, setMenuMoMobile] = useState(false);

  // CN19: Thông báo nhắc deadline sắp hết hạn (trong 24h tới) — banner đầu trang
  const [deadlinesGap, setDeadlinesGap] = useState([]);
  const [bannerAn, setBannerAn] = useState(false);

  // CN31: Chuông thông báo in-app (gộp deadline + môn nguy cơ + vượt ngân sách)
  const [thongBaos, setThongBaos] = useState([]);
  const [chuongMo, setChuongMo] = useState(false);
  const [daXemId, setDaXemId] = useState(() => {
    const saved = localStorage.getItem('thongbao_da_xem');
    return saved ? JSON.parse(saved) : [];
  });
  const chuongRef = useRef(null);

  useEffect(() => {
    async function taiThongBao() {
      try {
        const res = await api.get('/thong-bao');
        setThongBaos(res.data.thongBaos || []);
      } catch (error) {
        console.error(error);
      }
    }

    async function kiemTraDeadlineSapToi() {
      try {
        const res = await api.get('/deadline/sap-toi?soNgay=1');
        setDeadlinesGap(res.data.deadlines || []);

        if (res.data.deadlines?.length > 0 && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('⏰ Deadline sắp hết hạn!', {
              body: `Bạn có ${res.data.deadlines.length} deadline hết hạn trong 24h tới.`,
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    taiThongBao();
    kiemTraDeadlineSapToi();
    const timer = setInterval(() => {
      taiThongBao();
      kiemTraDeadlineSapToi();
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function xuLyClickNgoai(e) {
      if (chuongRef.current && !chuongRef.current.contains(e.target)) {
        setChuongMo(false);
      }
    }
    document.addEventListener('mousedown', xuLyClickNgoai);
    return () => document.removeEventListener('mousedown', xuLyClickNgoai);
  }, []);

  function xuLyDangXuat() {
    dangXuat();
    navigate('/login');
  }

  function moChuong() {
    setChuongMo(!chuongMo);
  }

  function danhDauDaXem(id) {
    const moi = [...new Set([...daXemId, id])];
    setDaXemId(moi);
    localStorage.setItem('thongbao_da_xem', JSON.stringify(moi));
  }

  function danhDauTatCaDaXem() {
    const moi = [...new Set([...daXemId, ...thongBaos.map((t) => t.id)])];
    setDaXemId(moi);
    localStorage.setItem('thongbao_da_xem', JSON.stringify(moi));
  }

  const soChuaXem = thongBaos.filter((t) => !daXemId.includes(t.id)).length;

  const getIconLoai = (loai) => {
    switch(loai) {
      case 'deadline': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'hoc_tap': return <BookOpen className="w-4 h-4 text-ink-500 dark:text-ink-400" />;
      case 'ngan_sach': return <Wallet className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const menu = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/mon-hoc', label: 'Học tập' },
    { path: '/deadline', label: 'Deadline' },
    { path: '/thoi-khoa-bieu', label: 'Thời khóa biểu' },
    { path: '/tai-chinh', label: 'Tài chính' },
    { path: '/ho-so', label: 'Hồ sơ' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center gap-4">
            
            {/* Cột trái (Logo) */}
            <div className="flex items-center gap-2 w-56 sm:w-60 xl:w-72 flex-shrink-0 min-w-0">
              <div className="w-8 h-8 bg-ink-600 dark:bg-ink-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-xl tracking-tight hidden sm:block truncate">
                Life<span className="text-ink-600 dark:text-ink-400">Hub</span>
              </span>
            </div>

            {/* Menu desktop (GlowingNav) - Luôn nằm cố định chính giữa tuyệt đối */}
            <div className="hidden md:flex flex-1 justify-center items-center">
              <GlowingNav menu={menu} />
            </div>

            {/* Cột phải (User, Chuông, Theme) - justify-between giúp neo vị trí icon tiện ích cố định, tên dài không làm xê dịch icon */}
            <div className="hidden md:flex items-center justify-between w-56 sm:w-60 xl:w-72 flex-shrink-0 min-w-0">
              {/* Nhóm icon tiện ích: Thông báo & Theme - Vị trí hoàn toàn ổn định không phụ thuộc độ dài tên */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Notifications */}
                <div className="relative" ref={chuongRef}>
                  <button
                    onClick={moChuong}
                    className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    title="Thông báo"
                  >
                    <Bell className="w-5 h-5" />
                    {soChuaXem > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                    )}
                  </button>

                  {chuongMo && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden transform opacity-100 scale-100 transition-all duration-200">
                      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Thông báo ({soChuaXem})</span>
                        {thongBaos.length > 0 && (
                          <button
                            onClick={danhDauTatCaDaXem}
                            className="text-xs font-medium text-ink-600 dark:text-ink-400 hover:text-ink-700 dark:hover:text-ink-300 transition-colors"
                          >
                            Đọc tất cả
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {thongBaos.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-8 text-center">
                            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">Không có thông báo nào</p>
                          </div>
                        ) : (
                          thongBaos.map((tb) => (
                            <div
                              key={tb.id}
                              onClick={() => danhDauDaXem(tb.id)}
                              className={`flex gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer transition-colors ${
                                !daXemId.includes(tb.id) ? 'bg-ink-50/50 dark:bg-ink-500/10 hover:bg-ink-50 dark:hover:bg-ink-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                              }`}
                            >
                              <div className="mt-0.5 flex-shrink-0">
                                {getIconLoai(tb.loai)}
                              </div>
                              <div>
                                <p className={`text-sm ${!daXemId.includes(tb.id) ? 'font-semibold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                  {tb.tieuDe}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{tb.moTa}</p>
                              </div>
                              {!daXemId.includes(tb.id) && (
                                <div className="w-1.5 h-1.5 bg-ink-600 dark:bg-ink-400 rounded-full mt-1.5 flex-shrink-0"></div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={doiTheme}
                  title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
                  className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Profile Menu: Avatar, Tên, Đăng xuất - Cố định ở góc phải, có giới hạn độ dài tên */}
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700 min-w-0 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                  {user?.ten?.charAt(0).toUpperCase()}
                </div>
                <span 
                  className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden lg:block max-w-[80px] xl:max-w-[105px] truncate" 
                  title={user?.ten}
                >
                  {user?.ten}
                </span>
                <button 
                  onClick={xuLyDangXuat} 
                  className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors flex-shrink-0"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-1">
              <button onClick={moChuong} className="p-2 relative text-slate-500 dark:text-slate-400">
                <Bell className="w-5 h-5" />
                {soChuaXem > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                )}
              </button>
              <button onClick={doiTheme} className="p-2 text-slate-500 dark:text-slate-400">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                className="p-2 text-slate-500 dark:text-slate-400"
                onClick={() => setMenuMoMobile(!menuMoMobile)}
              >
                {menuMoMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuMoMobile && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 pt-2 pb-4 space-y-1 shadow-lg absolute w-full left-0 z-50">
            {menu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuMoMobile(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-ink-50 dark:bg-ink-500/10 text-ink-700 dark:text-ink-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 px-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                  {user?.ten?.charAt(0).toUpperCase()}
                </div>
                <span 
                  className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[200px] truncate"
                  title={user?.ten}
                >
                  {user?.ten}
                </span>
              </div>
              <button 
                onClick={xuLyDangXuat} 
                className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Banner nhắc deadline sắp hết hạn */}
      {deadlinesGap.length > 0 && !bannerAn && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700/30 px-4 sm:px-6 py-3 flex justify-between items-start sm:items-center text-sm text-amber-800 dark:text-amber-200 transition-colors">
          <div className="flex items-start sm:items-center gap-3 max-w-7xl mx-auto w-full">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="flex-1">
              <strong className="font-semibold">Cảnh báo:</strong> Bạn có {deadlinesGap.length} deadline sắp hết hạn trong 24h tới ({deadlinesGap.map((d) => d.tieuDe).join(', ')}).
            </span>
            <button onClick={() => setBannerAn(true)} className="ml-4 p-1 rounded-md hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0.85, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {children || <Outlet />}
        </motion.div>
      </main>

      <Chatbot />
    </div>
  );
}

export default Layout;
