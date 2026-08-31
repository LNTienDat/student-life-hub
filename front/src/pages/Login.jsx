import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loi, setLoi] = useState('');
  const [dangTai, setDangTai] = useState(false);

  const navigate = useNavigate();
  const { dangNhap } = useAuth();

  async function xuLySubmit(e) {
    e.preventDefault();
    setLoi('');
    setDangTai(true);

    try {
      const res = await api.post('/auth/dang-nhap', { email, matKhau });
      dangNhap(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (error) {
      setLoi(error.response?.data?.message || 'Đã có lỗi xảy ra');
    } finally {
      setDangTai(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Thanh gáy — điểm nhấn xuyên suốt hệ thống thiết kế, gợi mép trang sổ tay */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink-600" />

          <div className="p-8 pl-9">
            <p className="text-xs font-medium text-slate-400 mb-1">Student Life Hub</p>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-6">
              Đăng nhập
            </h1>

            {loi && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg mb-4 text-sm">
                {loi}
              </div>
            )}

            <form onSubmit={xuLySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/40 focus:border-ink-500 transition"
                  required
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-600">Mật khẩu</label>
                  <Link to="/quen-mat-khau" className="text-xs text-ink-600 hover:text-ink-700">
                    Quên mật khẩu?
                  </Link>
                </div>
                <input
                  type="password"
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/40 focus:border-ink-500 transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={dangTai}
                className="w-full bg-ink-600 text-white font-medium py-2.5 rounded-lg hover:bg-ink-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                {dangTai ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-ink-600 hover:text-ink-700 font-medium">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
