import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

function Layout({ children }) {
  const { user, dangXuat } = useAuth();
  const { theme, doiTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuMoMobile, setMenuMoMobile] = useState(false);

  // CN19: Thông báo nhắc deadline sắp hết hạn (trong 24h tới)
  const [deadlinesGap, setDeadlinesGap] = useState([]);
  const [bannerAn, setBannerAn] = useState(false);

  useEffect(() => {
    async function kiemTraDeadlineSapToi() {
      try {
        const res = await api.get('/deadline/sap-toi?soNgay=1');
        setDeadlinesGap(res.data.deadlines || []);

        // Gửi thông báo desktop (Notification API) nếu trình duyệt hỗ trợ và đã cấp quyền
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
    kiemTraDeadlineSapToi();
    // Kiểm tra lại mỗi 5 phút
    const timer = setInterval(kiemTraDeadlineSapToi, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  function xuLyDangXuat() {
    dangXuat();
    navigate('/login');
  }

  const menu = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/mon-hoc', label: 'Học tập' },
    { path: '/deadline', label: 'Deadline' },
    { path: '/thoi-khoa-bieu', label: 'Thời khóa biểu' },
    { path: '/tai-chinh', label: 'Tài chính' },
    { path: '/ho-so', label: 'Hồ sơ' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 shadow px-4 sm:px-6 py-4 transition-colors">
        <div className="flex justify-between items-center">
          <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">Student Life Hub</span>

          {/* Menu desktop */}
          <div className="hidden md:flex gap-6 items-center">
            {menu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm ${
                  location.pathname === item.path
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={doiTheme}
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              className="text-lg leading-none hover:opacity-70"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">{user?.ten}</span>
            <button onClick={xuLyDangXuat} className="text-red-600 dark:text-red-400 hover:underline text-sm">
              Đăng xuất
            </button>
          </div>

          {/* Nút menu mobile */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={doiTheme}
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              className="text-lg leading-none"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              className="text-gray-600 dark:text-gray-300"
              onClick={() => setMenuMoMobile(!menuMoMobile)}
            >
              {menuMoMobile ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Menu mobile xổ xuống */}
        {menuMoMobile && (
          <div className="md:hidden mt-4 flex flex-col gap-3 pb-2">
            {menu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuMoMobile(false)}
                className={`text-sm ${
                  location.pathname === item.path
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex justify-between items-center pt-2 border-t dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-300">{user?.ten}</span>
              <button onClick={xuLyDangXuat} className="text-red-600 dark:text-red-400 text-sm">
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Banner nhắc deadline sắp hết hạn (CN19) */}
      {deadlinesGap.length > 0 && !bannerAn && (
        <div className="bg-orange-100 dark:bg-orange-900/40 border-b border-orange-200 dark:border-orange-800 px-4 sm:px-6 py-2 flex justify-between items-center text-sm text-orange-800 dark:text-orange-200">
          <span>
            ⏰ Bạn có <strong>{deadlinesGap.length}</strong> deadline sắp hết hạn trong 24h tới:{' '}
            {deadlinesGap.map((d) => d.tieuDe).join(', ')}
          </span>
          <button onClick={() => setBannerAn(true)} className="ml-3 font-semibold hover:opacity-70">
            ✕
          </button>
        </div>
      )}

      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}

export default Layout;
