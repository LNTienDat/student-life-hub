import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  GraduationCap,
  CalendarDays,
  Wallet,
  AlertTriangle,
  TrendingDown,
  ChevronRight,
  Inbox
} from 'lucide-react';

function Dashboard() {
  const { user } = useAuth();
  const [gpa, setGpa] = useState(null);
  const [deadlinesSapToi, setDeadlinesSapToi] = useState([]);
  const [monNguyCo, setMonNguyCo] = useState([]);
  const [nganSachVuot, setNganSachVuot] = useState([]);
  const [thongKeTaiChinh, setThongKeTaiChinh] = useState(null);
  const [gpaTheoKy, setGpaTheoKy] = useState([]);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    async function taiDuLieu() {
      try {
        const [resGpa, resDeadline, resCanhBao, resTaiChinh, resNganSach, resGpaKy] =
          await Promise.all([
            api.get('/academic/gpa'),
            api.get('/deadline/sap-toi?soNgay=7'),
            api.get('/academic/canh-bao'),
            api.get('/finance/thong-ke'),
            api.get('/finance/ngan-sach'),
            api.get('/academic/gpa-theo-ky'),
          ]);
        setGpa(resGpa.data.gpa);
        setDeadlinesSapToi(resDeadline.data.deadlines);
        setMonNguyCo(resCanhBao.data.monNguyCo);
        setThongKeTaiChinh(resTaiChinh.data);
        setNganSachVuot(resNganSach.data.ketQua.filter((ns) => ns.vuotNganSach));
        setGpaTheoKy(resGpaKy.data.theoKy);
      } catch (error) {
        console.error(error);
      } finally {
        setDangTai(false);
      }
    }
    taiDuLieu();
  }, []);

  const MAU_DANH_MUC = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#db2777'];

  function dinhDangTien(so) {
    return so.toLocaleString('vi-VN') + ' đ';
  }

  function dinhDangNgay(ngay) {
    return new Date(ngay).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Xin chào, {user?.ten}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Tổng quan tình hình học tập và tài chính của bạn
          </p>
        </div>

        {dangTai ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 mt-4 font-medium">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* Hàng số liệu tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Link
                to="/mon-hoc"
                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">GPA hiện tại</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {gpa ?? '--'}
                </p>
              </Link>

              <Link
                to="/deadline"
                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Deadline (7 ngày tới)</p>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                  {deadlinesSapToi.length}
                </p>
              </Link>

              <Link
                to="/tai-chinh"
                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg text-green-600 dark:text-green-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Số dư tháng này</p>
                </div>
                <p
                  className={`text-3xl font-bold transition-colors ${
                    thongKeTaiChinh?.soDu >= 0 
                      ? 'text-green-600 dark:text-green-400 group-hover:text-green-500' 
                      : 'text-red-600 dark:text-red-400 group-hover:text-red-500'
                  }`}
                >
                  {thongKeTaiChinh ? dinhDangTien(thongKeTaiChinh.soDu) : '--'}
                </p>
              </Link>
            </div>

            {/* Cảnh báo môn nguy cơ */}
            {monNguyCo.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="font-semibold text-red-800 dark:text-red-300">
                    Cảnh báo: {monNguyCo.length} môn có nguy cơ điểm thấp
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {monNguyCo.map((mon, i) => (
                    <span
                      key={i}
                      className="text-sm bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 font-medium shadow-sm"
                    >
                      {mon.ten}: <span className="font-bold">{mon.diemHienTai}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cảnh báo vượt ngân sách */}
            {nganSachVuot.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    Cảnh báo: {nganSachVuot.length} danh mục vượt ngân sách tháng này
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {nganSachVuot.map((ns, i) => (
                    <span
                      key={i}
                      className="text-sm bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 font-medium capitalize shadow-sm"
                    >
                      {ns.danhMuc.replace('_', ' ')}: {dinhDangTien(ns.daChi)} / {dinhDangTien(ns.soTienToiDa)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Deadline sắp tới */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50">
                  <h2 className="font-semibold text-slate-800 dark:text-slate-200">Deadline sắp tới</h2>
                  <Link to="/deadline" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center font-medium">
                    Xem tất cả <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                <div className="p-5 flex-1">
                  {deadlinesSapToi.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-6">
                      <Inbox className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-sm">Không có deadline nào sắp tới.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {deadlinesSapToi.slice(0, 5).map((d) => (
                        <div
                          key={d.id}
                          className="flex justify-between items-center text-sm group"
                        >
                          <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{d.tieuDe}</span>
                          <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md text-xs font-medium">{dinhDangNgay(d.hanChot)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chi tiêu theo danh mục */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700/50">
                  <h2 className="font-semibold text-slate-800 dark:text-slate-200">Chi tiêu tháng này</h2>
                  <Link to="/tai-chinh" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center font-medium">
                    Chi tiết <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                <div className="p-5 flex-1">
                  {!thongKeTaiChinh || Object.keys(thongKeTaiChinh.theoDanhMuc).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-6">
                      <Inbox className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-sm">Chưa có chi tiêu nào tháng này.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(thongKeTaiChinh.theoDanhMuc).map(([danhMuc, soTien]) => (
                        <div
                          key={danhMuc}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">{danhMuc.replace('_', ' ')}</span>
                          <span className="text-slate-900 dark:text-white font-semibold">
                            {dinhDangTien(soTien)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mini-charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mini pie chart cơ cấu chi tiêu */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-6">Cơ cấu chi tiêu (mini)</h2>
                {!thongKeTaiChinh || Object.keys(thongKeTaiChinh.theoDanhMuc).length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <p className="text-sm">Chưa có dữ liệu.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={Object.entries(thongKeTaiChinh.theoDanhMuc).map(([name, value]) => ({
                          name: name.replace('_', ' '),
                          value,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={45}
                        stroke="none"
                        paddingAngle={2}
                      >
                        {Object.keys(thongKeTaiChinh.theoDanhMuc).map((_, index) => (
                          <Cell key={index} fill={MAU_DANH_MUC[index % MAU_DANH_MUC.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => dinhDangTien(value)} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Mini bar chart GPA theo kỳ */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-6">GPA theo kỳ (mini)</h2>
                {gpaTheoKy.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <p className="text-sm">Chưa có dữ liệu.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={gpaTheoKy} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="hocKy" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 4]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="gpa" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default Dashboard;
