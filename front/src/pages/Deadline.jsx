import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

function Deadline() {
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [hienFormThem, setHienFormThem] = useState(false);
  const [dangSuaId, setDangSuaId] = useState(null);

  const [tieuDe, setTieuDe] = useState('');
  const [moTa, setMoTa] = useState('');
  const [hanChot, setHanChot] = useState('');
  const [doUuTien, setDoUuTien] = useState('binh_thuong');

  async function taiDuLieu() {
    setDangTai(true);
    try {
      const res = await api.get('/deadline');
      setDanhSach(res.data.deadlines);
    } catch (error) {
      console.error(error);
    } finally {
      setDangTai(false);
    }
  }

  useEffect(() => {
    taiDuLieu();
  }, []);

  function moFormThem() {
    setDangSuaId(null);
    setTieuDe('');
    setMoTa('');
    setHanChot('');
    setDoUuTien('binh_thuong');
    setHienFormThem(!hienFormThem);
  }

  function chuyenNgayInput(ngayISO) {
    const d = new Date(ngayISO);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  function moFormSua(dl) {
    setHienFormThem(true);
    setDangSuaId(dl.id);
    setTieuDe(dl.tieuDe);
    setMoTa(dl.moTa || '');
    setHanChot(chuyenNgayInput(dl.hanChot));
    setDoUuTien(dl.doUuTien);
  }

  async function xuLySubmit(e) {
    e.preventDefault();
    try {
      if (dangSuaId) {
        await api.put(`/deadline/${dangSuaId}`, { tieuDe, moTa, hanChot, doUuTien });
      } else {
        await api.post('/deadline', { tieuDe, moTa, hanChot, doUuTien });
      }
      setTieuDe('');
      setMoTa('');
      setHanChot('');
      setDoUuTien('binh_thuong');
      setHienFormThem(false);
      setDangSuaId(null);
      taiDuLieu();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  async function xuLyHoanThanh(id) {
    try {
      await api.patch(`/deadline/${id}/hoan-thanh`);
      taiDuLieu();
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  }

  async function xuLyXoa(id) {
    if (!confirm('Bạn chắc chắn muốn xóa deadline này?')) return;
    try {
      await api.delete(`/deadline/${id}`);
      taiDuLieu();
    } catch (error) {
      alert('Xóa thất bại');
    }
  }

  function mauDoUuTien(uuTien) {
    if (uuTien === 'cao') return 'bg-red-100 text-red-600';
    if (uuTien === 'thap') return 'bg-gray-100 text-gray-600';
    return 'bg-yellow-100 text-yellow-700';
  }

  function dinhDangNgay(ngay) {
    return new Date(ngay).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const dangDienHanh = danhSach.filter((d) => d.trangThai === 'dang_dien_hanh');
  const daHoanThanh = danhSach.filter((d) => d.trangThai === 'hoan_thanh');

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Deadline & Công việc</h1>
          <button
            onClick={moFormThem}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {hienFormThem ? 'Hủy' : '+ Thêm deadline'}
          </button>
        </div>

        {hienFormThem && (
          <form onSubmit={xuLySubmit} className="bg-white p-4 rounded-lg shadow mb-6 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề</label>
              <input
                type="text"
                value={tieuDe}
                onChange={(e) => setTieuDe(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <input
                type="text"
                value={moTa}
                onChange={(e) => setMoTa(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Hạn chót</label>
                <input
                  type="datetime-local"
                  value={hanChot}
                  onChange={(e) => setHanChot(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium mb-1">Độ ưu tiên</label>
                <select
                  value={doUuTien}
                  onChange={(e) => setDoUuTien(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="thap">Thấp</option>
                  <option value="binh_thuong">Bình thường</option>
                  <option value="cao">Cao</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {dangSuaId ? 'Cập nhật' : 'Lưu'}
            </button>
          </form>
        )}

        {dangTai ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : (
          <>
            <h2 className="font-semibold text-gray-700 mb-3">
              Đang diễn hành ({dangDienHanh.length})
            </h2>
            {dangDienHanh.length === 0 ? (
              <p className="text-gray-400 text-sm mb-6">Không có deadline nào.</p>
            ) : (
              <div className="grid gap-3 mb-6">
                {dangDienHanh.map((d) => (
                  <div key={d.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{d.tieuDe}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${mauDoUuTien(d.doUuTien)}`}>
                          {d.doUuTien}
                        </span>
                      </div>
                      {d.moTa && <p className="text-sm text-gray-500 mt-1">{d.moTa}</p>}
                      <p className="text-sm text-gray-400 mt-1">Hạn: {dinhDangNgay(d.hanChot)}</p>
                      {d.monHoc && (
                        <p className="text-xs text-blue-500 mt-1">Môn: {d.monHoc.ten}</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <button
                        onClick={() => moFormSua(d)}
                        className="block text-blue-500 text-xs hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => xuLyHoanThanh(d.id)}
                        className="block text-green-600 text-xs hover:underline"
                      >
                        Hoàn thành
                      </button>
                      <button
                        onClick={() => xuLyXoa(d.id)}
                        className="block text-red-500 text-xs hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="font-semibold text-gray-700 mb-3">
              Đã hoàn thành ({daHoanThanh.length})
            </h2>
            {daHoanThanh.length === 0 ? (
              <p className="text-gray-400 text-sm">Chưa có deadline nào hoàn thành.</p>
            ) : (
              <div className="grid gap-3">
                {daHoanThanh.map((d) => (
                  <div key={d.id} className="bg-gray-50 p-4 rounded-lg shadow-sm flex justify-between items-center opacity-70">
                    <div>
                      <h3 className="font-semibold line-through">{d.tieuDe}</h3>
                      <p className="text-sm text-gray-400">Hạn: {dinhDangNgay(d.hanChot)}</p>
                    </div>
                    <button
                      onClick={() => xuLyXoa(d.id)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default Deadline;