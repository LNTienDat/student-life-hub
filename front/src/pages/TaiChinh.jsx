import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import Layout from '../components/Layout';
import api from '../services/api';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  X, 
  Download, 
  Search, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';

const DANH_MUC = ['an_uong', 'hoc_phi', 'tro', 'giai_tri', 'di_lai', 'khac'];
const TEN_DANH_MUC = {
  an_uong: 'Ăn uống',
  hoc_phi: 'Học phí',
  tro: 'Nhà trọ',
  giai_tri: 'Giải trí',
  di_lai: 'Đi lại',
  khac: 'Khác',
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

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

  // Pagination & Filter
  const [timKiem, setTimKiem] = useState('');
  const [locLoai, setLocLoai] = useState('');
  const [locDanhMuc, setLocDanhMuc] = useState('');
  const [chiThangNay, setChiThangNay] = useState(false);
  
  const [trangHienTai, setTrangHienTai] = useState(1);
  const [soTrang, setSoTrang] = useState(1);
  const [tongSoGiaoDich, setTongSoGiaoDich] = useState(0);
  const [dangTaiGD, setDangTaiGD] = useState(false);

  useEffect(() => {
    async function taiThongKe() {
      try {
        const [resTK, resNS, resXH] = await Promise.all([
          api.get('/finance/thong-ke'),
          api.get('/finance/ngan-sach'),
          api.get('/finance/xu-huong')
        ]);
        setThongKe(resTK.data);
        setNganSachs(resNS.data.ketQua || []);
        setXuHuong(resXH.data.xuHuong || []);
      } catch (error) {
        console.error(error);
      } finally {
        setDangTai(false);
      }
    }
    taiThongKe();
  }, []);

  async function taiGiaoDich(page = 1) {
    setDangTaiGD(true);
    try {
      const q = new URLSearchParams({
        page,
        limit: 10,
        timKiem,
        loai: locLoai,
        danhMuc: locDanhMuc,
        chiThangNay
      });
      const res = await api.get(`/finance/giao-dich?${q.toString()}`);
      setGiaoDichs(res.data.giaoDichs);
      setSoTrang(res.data.soTrang);
      setTrangHienTai(res.data.trangHienTai);
      setTongSoGiaoDich(res.data.tongSo);
    } catch (error) {
      console.error(error);
    } finally {
      setDangTaiGD(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      taiGiaoDich(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [timKiem, locLoai, locDanhMuc, chiThangNay]);

  function dinhDangTien(so) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(so || 0);
  }

  async function xuLyThemGiaoDich(e) {
    e.preventDefault();
    try {
      await api.post('/finance/giao-dich', {
        soTien: parseFloat(soTien),
        loai,
        danhMuc,
        moTa
      });
      setSoTien('');
      setMoTa('');
      setHienFormGD(false);
      
      const [resTK, resNS] = await Promise.all([
        api.get('/finance/thong-ke'),
        api.get('/finance/ngan-sach'),
      ]);
      setThongKe(resTK.data);
      setNganSachs(resNS.data.nganSachs);
      taiGiaoDich(1);
    } catch (error) {
      console.error(error);
      alert('Không thể thêm giao dịch!');
    }
  }

  async function xuLyXoaGiaoDich(id) {
    if (!window.confirm('Bạn có chắc muốn xóa giao dịch này?')) return;
    try {
      await api.delete(`/finance/giao-dich/${id}`);
      const resTK = await api.get('/finance/thong-ke');
      setThongKe(resTK.data);
      taiGiaoDich(trangHienTai);
    } catch (error) {
      console.error(error);
    }
  }

  async function taoGiaoDichNhanh(danhMuc) {
    setLoai('chi');
    setDanhMuc(danhMuc);
    setSoTien('');
    setMoTa('');
    setHienFormGD(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const dataBieuDo = thongKe && thongKe.theoDanhMuc ? Object.entries(thongKe.theoDanhMuc).map(([key, val]) => ({
    name: TEN_DANH_MUC[key] || key,
    value: val
  })).filter(item => item.value > 0) : [];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Quản lý tài chính
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Tháng {thang}/{nam}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('Tính năng xuất báo cáo đang được phát triển')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất báo cáo</span>
            </button>
            <button
              onClick={() => setHienFormGD(!hienFormGD)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                hienFormGD 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                : 'bg-ink-600 dark:bg-blue-600 text-white hover:bg-ink-700 dark:hover:bg-blue-700 shadow-sm shadow-ink-500/20'
              }`}
            >
              {hienFormGD ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {hienFormGD ? 'Hủy' : 'Thêm giao dịch'}
            </button>
          </div>
        </div>

        {dangTai ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="w-8 h-8 border-4 border-ink-200 border-t-ink-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500">Đang tải dữ liệu...</p>
          </div>
        ) : !thongKe ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <p className="text-rose-500">Lỗi tải dữ liệu thống kê!</p>
          </div>
        ) : (
          <>
            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-20 h-20 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 relative z-10">Tổng thu</p>
                <p className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400 relative z-10">{dinhDangTien(thongKe.tongThu)}</p>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingDown className="w-20 h-20 text-rose-500" />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 relative z-10">Tổng chi</p>
                <p className="font-display text-3xl font-bold text-rose-600 dark:text-rose-400 relative z-10">{dinhDangTien(thongKe.tongChi)}</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Wallet className="w-20 h-20 text-ink-500 dark:text-blue-500" />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 relative z-10">Số dư hiện tại</p>
                <p className={`font-display text-3xl font-bold relative z-10 ${thongKe.soDu >= 0 ? 'text-ink-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {dinhDangTien(thongKe.soDu)}
                </p>
              </div>
            </div>

            {/* Layout 2 cột: Ngân sách & Biểu đồ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Ngân sách */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-amber-500" />
                    Ngân sách tháng này
                  </h2>
                </div>

                <div className="space-y-5 flex-1">
                  {nganSachs.map((ns) => {
                    const daChi = (thongKe.theoDanhMuc && thongKe.theoDanhMuc[ns.danhMuc]) || 0;
                    const phanTram = ns.hanMuc > 0 ? (daChi / ns.hanMuc) * 100 : 0;
                    const vuotNgay = phanTram > 100;
                    const canhBao = phanTram >= 80 && !vuotNgay;

                    return (
                      <div key={ns.id} className="group cursor-pointer" onClick={() => taoGiaoDichNhanh(ns.danhMuc)}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-ink-600 dark:group-hover:text-blue-400 transition-colors">
                            {TEN_DANH_MUC[ns.danhMuc] || ns.danhMuc}
                          </span>
                          <span className={`font-medium ${vuotNgay ? 'text-rose-600 dark:text-rose-400' : canhBao ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {dinhDangTien(daChi)} / {dinhDangTien(ns.hanMuc)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full ${
                              vuotNgay ? 'bg-rose-500' : canhBao ? 'bg-amber-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(phanTram, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Biểu đồ xu hướng */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col h-full">
                <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Xu hướng thu/chi 6 tháng
                </h2>
                
                <div className="flex-1 w-full min-h-[250px]">
                  {xuHuong.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={xuHuong} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="thang" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                        <YAxis 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{ fill: '#64748b' }}
                          tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(1)}tr` : `${value/1000}k`}
                        />
                        <Tooltip 
                          formatter={(value) => dinhDangTien(value)}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="thu" stroke="#10b981" name="Thu" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="chi" stroke="#ef4444" name="Chi" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">Chưa đủ dữ liệu</div>
                  )}
                </div>
              </div>
            </div>

            {/* Lịch sử giao dịch */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
              
              {/* Form thêm giao dịch (Collapse) */}
              {hienFormGD && (
                <div className="p-6 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/30">
                  <h3 className="font-display font-semibold text-slate-800 dark:text-slate-200 mb-4">Thêm giao dịch mới</h3>
                  <form onSubmit={xuLyThemGiaoDich} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Loại</label>
                        <select
                          value={loai}
                          onChange={(e) => setLoai(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                        >
                          <option value="chi">Chi tiêu</option>
                          <option value="thu">Thu nhập</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Danh mục</label>
                        <select
                          value={danhMuc}
                          onChange={(e) => setDanhMuc(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                        >
                          {DANH_MUC.map((dm) => (
                            <option key={dm} value={dm}>{TEN_DANH_MUC[dm]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Số tiền</label>
                        <input
                          type="number"
                          value={soTien}
                          onChange={(e) => setSoTien(e.target.value)}
                          placeholder="Ví dụ: 50000"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mô tả (Không bắt buộc)</label>
                      <input
                        type="text"
                        value={moTa}
                        onChange={(e) => setMoTa(e.target.value)}
                        placeholder="Mua sách, tiền điện..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit" className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors">
                        Lưu giao dịch
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Bộ lọc */}
              <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={timKiem}
                      onChange={(e) => setTimKiem(e.target.value)}
                      placeholder="Tìm kiếm giao dịch..."
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                    />
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <select
                      value={locLoai}
                      onChange={(e) => setLocLoai(e.target.value)}
                      className="w-full md:w-auto bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                    >
                      <option value="">Tất cả loại</option>
                      <option value="thu">Thu nhập</option>
                      <option value="chi">Chi tiêu</option>
                    </select>
                    <select
                      value={locDanhMuc}
                      onChange={(e) => setLocDanhMuc(e.target.value)}
                      className="w-full md:w-auto bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
                    >
                      <option value="">Tất cả danh mục</option>
                      {DANH_MUC.map((dm) => (
                        <option key={dm} value={dm}>{TEN_DANH_MUC[dm]}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full md:w-auto">
                    <input
                      type="checkbox"
                      checked={chiThangNay}
                      onChange={(e) => setChiThangNay(e.target.checked)}
                      className="rounded border-slate-300 text-ink-600 focus:ring-ink-500"
                    />
                    Chỉ tháng này
                  </label>
                </div>
              </div>

              {/* Danh sách */}
              <div className="min-h-[300px]">
                {dangTaiGD ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-ink-500 rounded-full animate-spin"></div>
                  </div>
                ) : giaoDichs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-3">
                      <Filter className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Không tìm thấy giao dịch</h3>
                    <p className="text-xs text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {giaoDichs.map((gd) => (
                      <div key={gd.id} className="p-4 md:p-6 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${gd.loai === 'thu' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                            {gd.loai === 'thu' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {TEN_DANH_MUC[gd.danhMuc] || gd.danhMuc}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>{new Date(gd.ngayGiaoDich).toLocaleDateString('vi-VN')}</span>
                              {gd.moTa && (
                                <>
                                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                  <span className="truncate max-w-[150px] md:max-w-xs">{gd.moTa}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`font-display font-bold ${gd.loai === 'thu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {gd.loai === 'thu' ? '+' : '-'}{dinhDangTien(gd.soTien)}
                          </span>
                          <button
                            onClick={() => xuLyXoaGiaoDich(gd.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Xóa giao dịch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Phân trang */}
              {soTrang > 1 && (
                <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/30 flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Trang <span className="font-semibold text-slate-900 dark:text-white">{trangHienTai}</span> / {soTrang}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => taiGiaoDich(trangHienTai - 1)}
                      disabled={trangHienTai <= 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => taiGiaoDich(trangHienTai + 1)}
                      disabled={trangHienTai >= soTrang}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default TaiChinh;
