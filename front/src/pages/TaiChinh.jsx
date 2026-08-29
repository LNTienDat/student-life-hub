import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import Layout from '../components/Layout';
import api from '../services/api';

const DANH_MUC = ['an_uong', 'hoc_phi', 'tro', 'giai_tri', 'di_lai', 'khac'];
const TEN_DANH_MUC = {
  an_uong: 'Ăn uống',
  hoc_phi: 'Học phí',
  tro: 'Nhà trọ',
  giai_tri: 'Giải trí',
  di_lai: 'Đi lại',
  khac: 'Khác',
};

function TaiChinh() {
  const now = new Date();
  const [thang] = useState(now.getMonth() + 1);
  const [nam] = useState(now.getFullYear());

  const [giaoDichs, setGiaoDichs] = useState([]);
  const [thongKe, setThongKe] = useState(null);
  const [nganSachs, setNganSachs] = useState([]);
  const [xuHuong, setXuHuong] = useState([]);
  const [dangTai, setDangTai] = useState(true);

  const [hienFormGD, setHienFormGD] = useState(false);
  const [loai, setLoai] = useState('chi');
  const [danhMuc, setDanhMuc] = useState('an_uong');
  const [soTien, setSoTien] = useState('');
  const [moTa, setMoTa] = useState('');

  const [hienFormNS, setHienFormNS] = useState(false);
  const [nsDanhMuc, setNsDanhMuc] = useState('an_uong');
  const [nsSoTien, setNsSoTien] = useState('');

  async function taiDuLieu() {
    setDangTai(true);
    try {
      const [resGD, resTK, resNS, resXH] = await Promise.all([
        api.get(`/finance/giao-dich?thang=${thang}&nam=${nam}`),
        api.get(`/finance/thong-ke?thang=${thang}&nam=${nam}`),
        api.get(`/finance/ngan-sach?thang=${thang}&nam=${nam}`),
        api.get('/finance/xu-huong?soThang=6'),
      ]);
      setGiaoDichs(resGD.data.giaoDichs);
      setThongKe(resTK.data);
      setNganSachs(resNS.data.ketQua || resNS.data.nganSachs || []);
      setXuHuong(resXH.data.xuHuong);
    } catch (error) {
      console.error(error);
    } finally {
      setDangTai(false);
    }
  }

  useEffect(() => {
    taiDuLieu();
  }, []);

  async function xuLyThemGiaoDich(e) {
    e.preventDefault();
    try {
      await api.post('/finance/giao-dich', {
        loai,
        danhMuc,
        soTien: parseFloat(soTien),
        moTa,
      });
      setSoTien('');
      setMoTa('');
      setHienFormGD(false);
      taiDuLieu();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  async function xuLyXoaGiaoDich(id) {
    if (!confirm('Xóa giao dịch này?')) return;
    try {
      await api.delete(`/finance/giao-dich/${id}`);
      taiDuLieu();
    } catch (error) {
      alert('Xóa thất bại');
    }
  }

  async function xuLyDatNganSach(e) {
    e.preventDefault();
    try {
      await api.post('/finance/ngan-sach', {
        danhMuc: nsDanhMuc,
        soTienToiDa: parseFloat(nsSoTien),
        thang,
        nam,
      });
      setNsSoTien('');
      setHienFormNS(false);
      taiDuLieu();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  function dinhDangTien(so) {
    return so.toLocaleString('vi-VN') + ' đ';
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Quản lý tài chính</h1>
        <p className="text-gray-500 mb-6">Tháng {thang}/{nam}</p>

        {dangTai ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : (
          <>
            {/* Tổng quan */}
            {thongKe && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-500">Tổng thu</p>
                  <p className="text-xl font-bold text-green-600">{dinhDangTien(thongKe.tongThu)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-500">Tổng chi</p>
                  <p className="text-xl font-bold text-red-600">{dinhDangTien(thongKe.tongChi)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-gray-500">Số dư</p>
                  <p className={`text-xl font-bold ${thongKe.soDu >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {dinhDangTien(thongKe.soDu)}
                  </p>
                </div>
              </div>
            )}

            {/* Ngân sách */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-700">Ngân sách tháng này</h2>
              <button
                onClick={() => setHienFormNS(!hienFormNS)}
                className="text-blue-600 text-sm hover:underline"
              >
                {hienFormNS ? 'Hủy' : '+ Đặt ngân sách'}
              </button>
            </div>

            {hienFormNS && (
              <form onSubmit={xuLyDatNganSach} className="bg-white p-4 rounded-lg shadow mb-4 flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Danh mục</label>
                  <select
                    value={nsDanhMuc}
                    onChange={(e) => setNsDanhMuc(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    {DANH_MUC.map((dm) => (
                      <option key={dm} value={dm}>{TEN_DANH_MUC[dm]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Số tiền tối đa</label>
                  <input
                    type="number"
                    value={nsSoTien}
                    onChange={(e) => setNsSoTien(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Lưu
                </button>
              </form>
            )}

            {nganSachs.length === 0 ? (
              <p className="text-gray-400 text-sm mb-6">Chưa đặt ngân sách nào.</p>
            ) : (
              <div className="grid gap-3 mb-6">
                {nganSachs.map((ns, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{TEN_DANH_MUC[ns.danhMuc] || ns.danhMuc}</span>
                      <span className={`text-sm font-semibold ${ns.vuotNganSach ? 'text-red-600' : 'text-green-600'}`}>
                        {dinhDangTien(ns.daChi)} / {dinhDangTien(ns.soTienToiDa)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${ns.vuotNganSach ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{
                          width: `${Math.min((ns.daChi / ns.soTienToiDa) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    {ns.vuotNganSach && (
                      <p className="text-xs text-red-500 mt-1">⚠ Đã vượt ngân sách</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Biểu đồ chi tiêu */}
            {thongKe && Object.keys(thongKe.theoDanhMuc).length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h2 className="font-semibold text-gray-700 mb-3">Cơ cấu chi tiêu</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={Object.entries(thongKe.theoDanhMuc).map(([name, value]) => ({
                        name: TEN_DANH_MUC[name] || name,
                        value,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {Object.keys(thongKe.theoDanhMuc).map((_, index) => (
                        <Cell
                          key={index}
                          fill={['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'][index % 6]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString('vi-VN') + ' đ'} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {xuHuong.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h2 className="font-semibold text-gray-700 mb-3">Xu hướng thu/chi 6 tháng</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={xuHuong}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="thang" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value) => value.toLocaleString('vi-VN') + ' đ'} />
                    <Legend />
                    <Line type="monotone" dataKey="thu" stroke="#10b981" name="Thu" strokeWidth={2} />
                    <Line type="monotone" dataKey="chi" stroke="#ef4444" name="Chi" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Giao dịch */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-700">Giao dịch</h2>
              <button
                onClick={() => setHienFormGD(!hienFormGD)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                {hienFormGD ? 'Hủy' : '+ Thêm giao dịch'}
              </button>
            </div>

            {hienFormGD && (
              <form onSubmit={xuLyThemGiaoDich} className="bg-white p-4 rounded-lg shadow mb-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Loại</label>
                    <select
                      value={loai}
                      onChange={(e) => setLoai(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="chi">Chi tiêu</option>
                      <option value="thu">Thu nhập</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Danh mục</label>
                    <select
                      value={danhMuc}
                      onChange={(e) => setDanhMuc(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    >
                      {DANH_MUC.map((dm) => (
                        <option key={dm} value={dm}>{TEN_DANH_MUC[dm]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Số tiền</label>
                    <input
                      type="number"
                      value={soTien}
                      onChange={(e) => setSoTien(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
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
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Lưu
                </button>
              </form>
            )}

            {giaoDichs.length === 0 ? (
              <p className="text-gray-400 text-sm">Chưa có giao dịch nào trong tháng này.</p>
            ) : (
              <div className="bg-white rounded-lg shadow divide-y">
                {giaoDichs.map((gd) => (
                  <div key={gd.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {TEN_DANH_MUC[gd.danhMuc] || gd.danhMuc}
                        {gd.moTa && <span className="text-gray-400 font-normal"> · {gd.moTa}</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(gd.ngayGiaoDich).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${gd.loai === 'thu' ? 'text-green-600' : 'text-red-600'}`}>
                        {gd.loai === 'thu' ? '+' : '-'}{dinhDangTien(gd.soTien)}
                      </span>
                      <button
                        onClick={() => xuLyXoaGiaoDich(gd.id)}
                        className="text-red-400 text-xs hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
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

export default TaiChinh;