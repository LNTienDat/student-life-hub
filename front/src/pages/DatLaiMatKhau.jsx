import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

function DatLaiMatKhau() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [loi, setLoi] = useState('');
  const [thongBao, setThongBao] = useState('');
  const [dangTai, setDangTai] = useState(false);

  async function xuLySubmit(e) {
    e.preventDefault();
    setLoi('');
    setThongBao('');

    if (!token || !email) {
      setLoi('Liên kết không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu lại từ đầu.');
      return;
    }
    if (matKhauMoi !== xacNhan) {
      setLoi('Mật khẩu xác nhận không khớp');
      return;
    }

    setDangTai(true);
    try {
      const res = await api.post('/auth/dat-lai-mat-khau', { email, token, matKhauMoi });
      setThongBao(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setLoi(error.response?.data?.message || 'Đã có lỗi xảy ra');
    } finally {
      setDangTai(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-2 text-blue-600">
          Đặt lại mật khẩu
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Tài khoản: {email || 'không xác định'}
        </p>

        {loi && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
            {loi}
          </div>
        )}
        {thongBao && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">
            {thongBao} — đang chuyển đến trang đăng nhập...
          </div>
        )}

        <form onSubmit={xuLySubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
            <input
              type="password"
              value={matKhauMoi}
              onChange={(e) => setMatKhauMoi(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              minLength={6}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={xacNhan}
              onChange={(e) => setXacNhan(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={dangTai}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {dangTai ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          <Link to="/login" className="text-blue-600 hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

export default DatLaiMatKhau;
