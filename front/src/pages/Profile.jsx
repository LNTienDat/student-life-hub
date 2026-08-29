import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { dangNhap } = useAuth();
  const [ten, setTen] = useState('');
  const [truong, setTruong] = useState('');
  const [nganh, setNganh] = useState('');
  const [khoaHoc, setKhoaHoc] = useState('');
  const [thongBao, setThongBao] = useState('');

  const [matKhauCu, setMatKhauCu] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [thongBaoMK, setThongBaoMK] = useState('');

  useEffect(() => {
    async function tai() {
      const res = await api.get('/auth/ho-so');
      const u = res.data.user;
      setTen(u.ten || '');
      setTruong(u.truong || '');
      setNganh(u.nganh || '');
      setKhoaHoc(u.khoaHoc || '');
    }
    tai();
  }, []);

  async function xuLySuaHoSo(e) {
    e.preventDefault();
    setThongBao('');
    try {
      const res = await api.put('/auth/ho-so', { ten, truong, nganh, khoaHoc });
      const token = localStorage.getItem('token');
      dangNhap(res.data.user, token);
      setThongBao('Cập nhật thành công!');
    } catch (error) {
      setThongBao(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  async function xuLyDoiMatKhau(e) {
    e.preventDefault();
    setThongBaoMK('');
    try {
      await api.put('/auth/doi-mat-khau', { matKhauCu, matKhauMoi });
      setMatKhauCu('');
      setMatKhauMoi('');
      setThongBaoMK('Đổi mật khẩu thành công!');
    } catch (error) {
      setThongBaoMK(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Hồ sơ cá nhân</h1>

        <form onSubmit={xuLySuaHoSo} className="bg-white p-5 rounded-lg shadow space-y-3">
          <h2 className="font-semibold text-gray-700">Thông tin cá nhân</h2>
          {thongBao && <p className="text-sm text-blue-600">{thongBao}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Họ tên</label>
            <input value={ten} onChange={(e) => setTen(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Trường</label>
            <input value={truong} onChange={(e) => setTruong(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ngành</label>
            <input value={nganh} onChange={(e) => setNganh(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Khóa học</label>
            <input value={khoaHoc} onChange={(e) => setKhoaHoc(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Lưu thông tin
          </button>
        </form>

        <form onSubmit={xuLyDoiMatKhau} className="bg-white p-5 rounded-lg shadow space-y-3">
          <h2 className="font-semibold text-gray-700">Đổi mật khẩu</h2>
          {thongBaoMK && <p className="text-sm text-blue-600">{thongBaoMK}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu hiện tại</label>
            <input type="password" value={matKhauCu} onChange={(e) => setMatKhauCu(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
            <input type="password" value={matKhauMoi} onChange={(e) => setMatKhauMoi(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
            Đổi mật khẩu
          </button>
        </form>
      </div>
    </Layout>
  );
}

export default Profile;