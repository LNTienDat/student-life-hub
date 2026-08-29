import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const CAC_THU = [
  { gia: 2, ten: 'Thứ 2' },
  { gia: 3, ten: 'Thứ 3' },
  { gia: 4, ten: 'Thứ 4' },
  { gia: 5, ten: 'Thứ 5' },
  { gia: 6, ten: 'Thứ 6' },
  { gia: 7, ten: 'Thứ 7' },
  { gia: 8, ten: 'Chủ nhật' },
];

const MAU_MON = [
  'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200',
  'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-200',
  'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-200',
  'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-200',
  'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/40 dark:border-pink-700 dark:text-pink-200',
  'bg-teal-100 border-teal-300 text-teal-800 dark:bg-teal-900/40 dark:border-teal-700 dark:text-teal-200',
];

function mauChoMon(tenMon) {
  let hash = 0;
  for (let i = 0; i < tenMon.length; i++) hash = tenMon.charCodeAt(i) + ((hash << 5) - hash);
  return MAU_MON[Math.abs(hash) % MAU_MON.length];
}

function gioSangPhut(gio) {
  const [h, m] = gio.split(':').map(Number);
  return h * 60 + m;
}

function ThoiKhoaBieu() {
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [hienForm, setHienForm] = useState(false);
  const [dangSuaId, setDangSuaId] = useState(null);

  const [tenMon, setTenMon] = useState('');
  const [thu, setThu] = useState(2);
  const [gioBatDau, setGioBatDau] = useState('07:00');
  const [gioKetThuc, setGioKetThuc] = useState('09:00');
  const [phongHoc, setPhongHoc] = useState('');
  const [giangVien, setGiangVien] = useState('');

  async function taiDuLieu() {
    setDangTai(true);
    try {
      const res = await api.get('/thoi-khoa-bieu');
      setDanhSach(res.data.thoiKhoaBieu);
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
    setTenMon('');
    setThu(2);
    setGioBatDau('07:00');
    setGioKetThuc('09:00');
    setPhongHoc('');
    setGiangVien('');
    setHienForm(!hienForm);
  }

  function moFormSua(bh) {
    setHienForm(true);
    setDangSuaId(bh.id);
    setTenMon(bh.tenMon);
    setThu(bh.thu);
    setGioBatDau(bh.gioBatDau);
    setGioKetThuc(bh.gioKetThuc);
    setPhongHoc(bh.phongHoc || '');
    setGiangVien(bh.giangVien || '');
  }

  async function xuLySubmit(e) {
    e.preventDefault();
    if (gioSangPhut(gioKetThuc) <= gioSangPhut(gioBatDau)) {
      alert('Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }
    try {
      const data = { tenMon, thu, gioBatDau, gioKetThuc, phongHoc, giangVien };
      if (dangSuaId) {
        await api.put(`/thoi-khoa-bieu/${dangSuaId}`, data);
      } else {
        await api.post('/thoi-khoa-bieu', data);
      }
      setHienForm(false);
      taiDuLieu();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  async function xuLyXoa(id) {
    if (!confirm('Xóa buổi học này khỏi thời khóa biểu?')) return;
    try {
      await api.delete(`/thoi-khoa-bieu/${id}`);
      taiDuLieu();
    } catch (error) {
      alert('Xóa thất bại');
    }
  }

  const buoiTheoThu = CAC_THU.reduce((map, t) => {
    map[t.gia] = danhSach
      .filter((bh) => bh.thu === t.gia)
      .sort((a, b) => gioSangPhut(a.gioBatDau) - gioSangPhut(b.gioBatDau));
    return map;
  }, {});

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Thời khóa biểu tuần</h1>
          <button
            onClick={moFormThem}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {hienForm ? 'Hủy' : '+ Thêm buổi học'}
          </button>
        </div>

        {hienForm && (
          <form
            onSubmit={xuLySubmit}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          >
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Tên môn</label>
              <input
                value={tenMon}
                onChange={(e) => setTenMon(e.target.value)}
                className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Thứ</label>
              <select
                value={thu}
                onChange={(e) => setThu(parseInt(e.target.value))}
                className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2"
              >
                {CAC_THU.map((t) => (
                  <option key={t.gia} value={t.gia}>{t.ten}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">Giờ bắt đầu</label>
                <input
                  type="time"
                  value={gioBatDau}
                  onChange={(e) => setGioBatDau(e.target.value)}
                  className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">Giờ kết thúc</label>
                <input
                  type="time"
                  value={gioKetThuc}
                  onChange={(e) => setGioKetThuc(e.target.value)}
                  className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Phòng học</label>
              <input
                value={phongHoc}
                onChange={(e) => setPhongHoc(e.target.value)}
                className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Giảng viên</label>
              <input
                value={giangVien}
                onChange={(e) => setGiangVien(e.target.value)}
                className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-2"
              />
            </div>
            <div className="md:col-span-3">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                {dangSuaId ? 'Cập nhật' : 'Thêm vào thời khóa biểu'}
              </button>
            </div>
          </form>
        )}

        {dangTai ? (
          <p className="text-gray-500 dark:text-gray-400">Đang tải...</p>
        ) : danhSach.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm">Chưa có buổi học nào trong thời khóa biểu.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {CAC_THU.map((t) => (
              <div key={t.gia} className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
                <h3 className="font-semibold text-center text-gray-700 dark:text-gray-200 mb-2 pb-2 border-b dark:border-gray-700">
                  {t.ten}
                </h3>
                <div className="space-y-2 min-h-[60px]">
                  {buoiTheoThu[t.gia].length === 0 ? (
                    <p className="text-xs text-gray-300 dark:text-gray-600 text-center">—</p>
                  ) : (
                    buoiTheoThu[t.gia].map((bh) => (
                      <div
                        key={bh.id}
                        className={`border rounded p-2 text-xs ${mauChoMon(bh.tenMon)}`}
                      >
                        <p className="font-semibold">{bh.tenMon}</p>
                        <p>{bh.gioBatDau} - {bh.gioKetThuc}</p>
                        {bh.phongHoc && <p>Phòng: {bh.phongHoc}</p>}
                        {bh.giangVien && <p>GV: {bh.giangVien}</p>}
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => moFormSua(bh)} className="hover:underline">Sửa</button>
                          <button onClick={() => xuLyXoa(bh.id)} className="hover:underline">Xóa</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ThoiKhoaBieu;
