import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function Register() {
  const [ten, setTen] = useState('');
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loi, setLoi] = useState('');
  const [dangTai, setDangTai] = useState(false);

  const navigate = useNavigate();

  async function xuLySubmit(e) {
    e.preventDefault();
    setLoi('');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">
          Đăng ký
        </h1>

        {loi && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
            {loi}
          </div>
        )}

        <form onSubmit={xuLySubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Họ tên</label>
            <input
              type="text"
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input
              type="password"
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={dangTai}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {dangTai ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;