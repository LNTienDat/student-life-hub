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
  Inbox,
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

  // Bảng màu biểu đồ theo token thiết kế (ink / teal / amber / rose / slate)
  const MAU_DANH_MUC = ['#2E3159', '#0D9488', '#D97706', '#BE123C', '#8E98CB', '#64748B'];

  function dinhDangTien(so) {
    return so.toLocaleString('vi-VN') + ' đ';
  }

  function dinhDangNgay(ngay) {
    return new Date(ngay).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  const soDuDuong = thongKeTaiChinh?.soDu >= 0;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-sm text-slate-400 mb-1">Student Life Hub</p>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Xin chào, {user?.ten}!
          </h1>
          <p className="text-slate-500 mt-1">Tổng quan tình hình học tập và tài chính của bạn</p>
        </div>

        {dangTai ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-ink-200 border-t-ink-600 rounded-full animate-spin" />
            <p className="text-slate-500 mt-4 text-sm">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* Dải số liệu tổng quan — một khối "sổ cái" chia cột bằng hairline,
                thay vì 3 card trắng rời rạc giống hệt nhau */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink-600" />
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 pl-1">
                <Link to="/mon-hoc" className="p-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-sm font-medium">GPA hiện tại</span>
                  </div>
                  <p className="font-display text-3xl font-bold text-slate-900 group-hover:text-ink-600 transition-colors">
                    {gpa ?? '--'}
                  </p>
                </Link>

                <Link to="/deadline" className="p-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm font-medium">Deadline (7 ngày tới)</span>
                  </div>
                  <p className="font-display text-3xl font-bold text-slate-900 group-hover:text-ink-600 transition-colors">
                    {deadlinesSapToi.length}
                  </p>
                </Link>

                <Link to="/tai-chinh" className="p-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm font-medium">Số dư tháng này</span>
                  </div>
                  <p
                    className={`font-display text-3xl font-bold transition-colors ${
                      soDuDuong ? 'text-teal-600' : 'text-rose-700'
                    }`}
                  >
                    {thongKeTaiChinh ? dinhDangTien(thongKeTaiChinh.soDu) : '--'}
                  </p>
                </Link>
              </div>
            </div>

            {/* Cảnh báo môn nguy cơ — spine cảnh báo bên trái thay vì khung viền đủ 4 cạnh */}
            {monNguyCo.length > 0 && (
              <div className="bg-rose-50 border-l-4 border-rose-500 rounded-r-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-rose-700" />
                  <p className="font-semibold text-rose-800">
                    Cảnh báo: {monNguyCo.length} môn có nguy cơ điểm thấp
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {monNguyCo.map((mon, i) => (
                    <span
                      key={i}
                      className="text-sm bg-white px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 font-medium"
                    >
                      {mon.ten}: <span className="font-bold">{mon.diemHienTai}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cảnh báo vượt ngân sách — amber, chỉ dùng cho ngữ cảnh khẩn cấp/cảnh báo */}
            {nganSachVuot.length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-amber-700" />
                  <p className="font-semibold text-amber-800">
                    Cảnh báo: {nganSachVuot.length} danh mục vượt ngân sách tháng này
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {nganSachVuot.map((ns, i) => (
                    <span
                      key={i}
                      className="text-sm bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 font-medium capitalize"
                    >
                      {ns.danhMuc.replace('_', ' ')}: {dinhDangTien(ns.daChi)} / {dinhDangTien(ns.soTienToiDa)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Deadline sắp tới — danh sách hàng phân cách hairline, không boxed từng dòng */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-800">Deadline sắp tới</h2>
                  <Link
                    to="/deadline"
                    className="text-sm text-ink-600 hover:text-ink-700 flex items-center font-medium"
                  >
                    Xem tất cả <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Link>
                </div>
                <div className="px-5 flex-1">
                  {deadlinesSapToi.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                      <Inbox className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">Không có deadline nào sắp tới.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {deadlinesSapToi.slice(0, 5).map((d) => (
                        <div key={d.id} className="flex justify-between items-center text-sm py-3 group">
                          <span className="font-medium text-slate-700 group-hover:text-ink-600 transition-colors">
                            {d.tieuDe}
                          </span>
                          <span className="text-slate-500 text-xs font-medium tabular-nums">
                            {dinhDangNgay(d.hanChot)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="h-2" />
              </div>

              {/* Chi tiêu theo danh mục */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-800">Chi tiêu tháng này</h2>
                  <Link
                    to="/tai-chinh"
                    className="text-sm text-ink-600 hover:text-ink-700 flex items-center font-medium"
                  >
                    Chi tiết <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Link>
                </div>
                <div className="px-5 flex-1">
                  {!thongKeTaiChinh || Object.keys(thongKeTaiChinh?.theoDanhMuc || {}).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                      <Inbox className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">Chưa có chi tiêu nào tháng này.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {Object.entries(thongKeTaiChinh?.theoDanhMuc || {}).map(([danhMuc, soTien]) => (
                        <div key={danhMuc} className="flex justify-between items-center text-sm py-3">
                          <span className="capitalize text-slate-700 font-medium">
                            {danhMuc.replace('_', ' ')}
                          </span>
                          <span className="text-slate-900 font-semibold tabular-nums">
                            {dinhDangTien(soTien)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="h-2" />
              </div>
            </div>

            {/* Mini-charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-800 mb-6">Cơ cấu chi tiêu</h2>
                {!thongKeTaiChinh || Object.keys(thongKeTaiChinh?.theoDanhMuc || {}).length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                    Chưa có dữ liệu.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={Object.entries(thongKeTaiChinh?.theoDanhMuc || {}).map(([name, value]) => ({
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
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-800 mb-6">GPA theo kỳ</h2>
                {gpaTheoKy.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                    Chưa có dữ liệu.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={gpaTheoKy} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="hocKy" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 4]} tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="gpa" fill="#2E3159" radius={[6, 6, 0, 0]} maxBarSize={40} />
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
