import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function QuenMatKhau() {
  const [email, setEmail] = useState('');
  const [loi, setLoi] = useState('');
  const [thongBao, setThongBao] = useState('');
  const [dangTai, setDangTai] = useState(false);

  async function xuLySubmit(e) {
    e.preventDefault();
    setLoi('');
    setThongBao('');
    setDangTai(true);

    try {
      const res = await api.post('/auth/quen-mat-khau', { email });
      setThongBao(res.data.message);
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
          Quên mật khẩu
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
        </p>

        {loi && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
            {loi}
          </div>
        )}
        {thongBao && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">
            {thongBao}
          </div>
        )}

        <form onSubmit={xuLySubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={dangTai}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {dangTai ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
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

export default QuenMatKhau;
