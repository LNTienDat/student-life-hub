import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

function Deadline() {
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [hienFormThem, setHienFormThem] = useState(false);
  const [dangSuaId, setDangSuaId] = useState(null);
  const [cheDoXem, setCheDoXem] = useState('list'); // 'list' | 'calendar'
  const [thangXemLich, setThangXemLich] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [ngayDuocChon, setNgayDuocChon] = useState(null);

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

  // ===== Calendar View helpers =====
  const TEN_THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const TEN_THANG = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  function khoaNgay(d) {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
  }

  const deadlineTheoNgay = danhSach.reduce((map, d) => {
    const key = khoaNgay(d.hanChot);
    if (!map[key]) map[key] = [];
    map[key].push(d);
    return map;
  }, {});

  function taoLuoiThang(thangGoc) {
    const nam = thangGoc.getFullYear();
    const thang = thangGoc.getMonth();
    const ngayDauThang = new Date(nam, thang, 1);
    const ngayCuoiThang = new Date(nam, thang + 1, 0);
    const soOTruoc = ngayDauThang.getDay(); // 0 = CN
    const oLuoi = [];

    for (let i = 0; i < soOTruoc; i++) oLuoi.push(null);
    for (let ngay = 1; ngay <= ngayCuoiThang.getDate(); ngay++) {
      oLuoi.push(new Date(nam, thang, ngay));
    }
    while (oLuoi.length % 7 !== 0) oLuoi.push(null);
    return oLuoi;
  }

  const luoiThang = taoLuoiThang(thangXemLich);
  const homNay = new Date();

  function chuyenThang(buoc) {
    setNgayDuocChon(null);
    setThangXemLich(
      (t) => new Date(t.getFullYear(), t.getMonth() + buoc, 1)
    );
  }

  const deadlinesNgayDuocChon = ngayDuocChon ? deadlineTheoNgay[khoaNgay(ngayDuocChon)] || [] : [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Deadline & Công việc</h1>
          <div className="flex items-center gap-3">
            <div className="bg-white border rounded-lg p-1 flex text-sm">
              <button
                onClick={() => setCheDoXem('list')}
                className={`px-3 py-1 rounded ${cheDoXem === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
              >
                Danh sách
              </button>
              <button
                onClick={() => setCheDoXem('calendar')}
                className={`px-3 py-1 rounded ${cheDoXem === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
              >
                Lịch
              </button>
            </div>
            <button
              onClick={moFormThem}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {hienFormThem ? 'Hủy' : '+ Thêm deadline'}
            </button>
          </div>
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
        ) : cheDoXem === 'calendar' ? (
          <>
            {/* Calendar View */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => chuyenThang(-1)}
                  className="px-3 py-1 rounded border hover:bg-gray-50 text-sm"
                >
                  ← Trước
                </button>
                <h2 className="font-semibold text-gray-700">
                  {TEN_THANG[thangXemLich.getMonth()]} {thangXemLich.getFullYear()}
                </h2>
                <button
                  onClick={() => chuyenThang(1)}
                  className="px-3 py-1 rounded border hover:bg-gray-50 text-sm"
                >
                  Sau →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {TEN_THU.map((t) => (
                  <div key={t} className="text-center text-xs font-medium text-gray-400 py-1">
                    {t}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {luoiThang.map((ngay, i) => {
                  if (!ngay) return <div key={i} className="min-h-[70px]" />;
                  const ds = deadlineTheoNgay[khoaNgay(ngay)] || [];
                  const laHomNay = khoaNgay(ngay) === khoaNgay(homNay);
                  const dangDuocChon = ngayDuocChon && khoaNgay(ngay) === khoaNgay(ngayDuocChon);
                  return (
                    <button
                      key={i}
                      onClick={() => setNgayDuocChon(ngay)}
                      className={`min-h-[70px] p-1 rounded border text-left align-top hover:bg-blue-50 transition ${
                        dangDuocChon ? 'border-blue-500 ring-1 ring-blue-400' : 'border-gray-100'
                      }`}
                    >
                      <span
                        className={`text-xs inline-flex items-center justify-center w-5 h-5 rounded-full ${
                          laHomNay ? 'bg-blue-600 text-white' : 'text-gray-600'
                        }`}
                      >
                        {ngay.getDate()}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {ds.slice(0, 2).map((d) => (
                          <div
                            key={d.id}
                            className={`text-[10px] truncate px-1 rounded ${
                              d.trangThai === 'hoan_thanh'
                                ? 'bg-gray-100 text-gray-400 line-through'
                                : mauDoUuTien(d.doUuTien)
                            }`}
                          >
                            {d.tieuDe}
                          </div>
                        ))}
                        {ds.length > 2 && (
                          <div className="text-[10px] text-gray-400">+{ds.length - 2} khác</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chi tiết deadline của ngày được chọn */}
            {ngayDuocChon && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Deadline ngày {ngayDuocChon.toLocaleDateString('vi-VN')}
                </h3>
                {deadlinesNgayDuocChon.length === 0 ? (
                  <p className="text-gray-400 text-sm">Không có deadline nào trong ngày này.</p>
                ) : (
                  <div className="space-y-2">
                    {deadlinesNgayDuocChon.map((d) => (
                      <div
                        key={d.id}
                        className="flex justify-between items-start border-b pb-2 last:border-0"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${d.trangThai === 'hoan_thanh' ? 'line-through text-gray-400' : ''}`}
                            >
                              {d.tieuDe}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${mauDoUuTien(d.doUuTien)}`}>
                              {d.doUuTien}
                            </span>
                          </div>
                          {d.moTa && <p className="text-sm text-gray-500 mt-1">{d.moTa}</p>}
                          <p className="text-xs text-gray-400 mt-1">{dinhDangNgay(d.hanChot)}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <button
                            onClick={() => moFormSua(d)}
                            className="block text-blue-500 text-xs hover:underline"
                          >
                            Sửa
                          </button>
                          {d.trangThai !== 'hoan_thanh' && (
                            <button
                              onClick={() => xuLyHoanThanh(d.id)}
                              className="block text-green-600 text-xs hover:underline"
                            >
                              Hoàn thành
                            </button>
                          )}
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
              </div>
            )}
          </>
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