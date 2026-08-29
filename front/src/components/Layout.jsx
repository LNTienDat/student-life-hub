import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Layout({ children }) {
  const { user, dangXuat } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuMoMobile, setMenuMoMobile] = useState(false);

  function xuLyDangXuat() {
    dangXuat();
    navigate('/login');
  }

  const menu = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/mon-hoc', label: 'Học tập' },
    { path: '/deadline', label: 'Deadline' },
    { path: '/tai-chinh', label: 'Tài chính' },
    { path: '/ho-so', label: 'Hồ sơ' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          <span className="font-bold text-blue-600 text-lg">Student Life Hub</span>

          {/* Menu desktop */}
          <div className="hidden md:flex gap-6 items-center">
            {menu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm ${
                  location.pathname === item.path
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.ten}</span>
            <button onClick={xuLyDangXuat} className="text-red-600 hover:underline text-sm">
              Đăng xuất
            </button>
          </div>

          {/* Nút menu mobile */}
          <button
            className="md:hidden text-gray-600"
            onClick={() => setMenuMoMobile(!menuMoMobile)}
          >
            {menuMoMobile ? '✕' : '☰'}
          </button>
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
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-gray-600">{user?.ten}</span>
              <button onClick={xuLyDangXuat} className="text-red-600 text-sm">
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </nav>
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}

export default Layout;