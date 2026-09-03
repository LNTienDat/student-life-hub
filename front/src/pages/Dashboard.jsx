import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import api from '../services/api';
import { getCache, setCache } from '../services/apiCache';
import {
  GraduationCap,
  CalendarDays,
  Wallet,
  AlertTriangle,
  TrendingDown,
  ChevronRight,
  Inbox,
  ArrowUpRight,
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

function Dashboard() {
  const { user } = useAuth();
  const cached = getCache('dashboard_cache');
  const [gpa, setGpa] = useState(cached?.gpa ?? null);
  const [deadlinesSapToi, setDeadlinesSapToi] = useState(cached?.deadlinesSapToi ?? []);
  const [monNguyCo, setMonNguyCo] = useState(cached?.monNguyCo ?? []);
  const [nganSachVuot, setNganSachVuot] = useState(cached?.nganSachVuot ?? []);
  const [thongKeTaiChinh, setThongKeTaiChinh] = useState(cached?.thongKeTaiChinh ?? null);
  const [gpaTheoKy, setGpaTheoKy] = useState(cached?.gpaTheoKy ?? []);
  const [dangTai, setDangTai] = useState(!cached);

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
        const data = {
          gpa: resGpa.data.gpa,
          deadlinesSapToi: resDeadline.data.deadlines || [],
          monNguyCo: resCanhBao.data.monNguyCo || [],
          thongKeTaiChinh: resTaiChinh.data,
          nganSachVuot: resNganSach.data?.ketQua?.filter((ns) => ns.vuotNganSach) || [],
          gpaTheoKy: resGpaKy.data?.theoKy || [],
        };
        setGpa(data.gpa);
        setDeadlinesSapToi(data.deadlinesSapToi);
        setMonNguyCo(data.monNguyCo);
        setThongKeTaiChinh(data.thongKeTaiChinh);
        setNganSachVuot(data.nganSachVuot);
        setGpaTheoKy(data.gpaTheoKy);
        setCache('dashboard_cache', data);
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
    <>
      <div className="max-w-6xl mx-auto space-y-7 pb-10">
        {/* Header Chào Mừng */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-ink-900 via-ink-800 to-ink-700 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Học kỳ mới • Sẵn sàng bứt phá</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Xin chào, {user?.ten || 'Sinh viên'}! 👋
            </h1>
            <p className="text-white/70 text-sm max-w-xl">
              Cùng theo dõi mục tiêu GPA, kiểm soát chi tiêu và hoàn thành các deadline đúng hạn hôm nay.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <Link
              to="/deadline"
              style={{ backgroundColor: '#ffffff', color: '#141527' }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-ink-900" />
              <span>Thêm việc cần làm</span>
            </Link>
          </div>
        </div>

        {dangTai ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-3 border-ink-200 border-t-ink-600 rounded-full animate-spin" />
            <p className="text-slate-500 mt-4 text-sm font-medium">Đang đồng bộ dữ liệu của bạn...</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Dãy 3 Thẻ Chỉ Số KPI Thông Minh */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Thẻ GPA */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Link
                  to="/mon-hoc"
                  className="group relative block bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-ink-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Học tập
                      </span>
                      <h3 className="text-base font-semibold text-slate-800 mt-0.5">GPA hiện tại</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-ink-50 flex items-center justify-center text-ink-600 group-hover:bg-ink-600 group-hover:text-white transition-colors duration-200">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="relative z-10 mt-5 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-extrabold text-slate-900 group-hover:text-ink-600 transition-colors">
                      {gpa !== null && gpa !== undefined ? Number(gpa).toFixed(2) : '--'}
                    </span>
                    <span className="text-sm font-medium text-slate-400">
                      / {Number(gpa) > 4 ? '10' : '4.0'}
                    </span>
                  </div>

                  <div className="relative z-10 mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-ink-600">
                      Chi tiết môn học <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-slate-400">
                      {Number(gpa) > 4 ? 'Thang 10' : 'Thang 4'}
                    </span>
                  </div>
                </Link>
              </motion.div>

              {/* Thẻ Deadline */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Link
                  to="/deadline"
                  className="group relative block bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Tiến độ
                      </span>
                      <h3 className="text-base font-semibold text-slate-800 mt-0.5">Deadline sắp tới</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-200">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="relative z-10 mt-5 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                      {deadlinesSapToi.length}
                    </span>
                    <span className="text-sm font-medium text-slate-400">nhiệm vụ</span>
                  </div>

                  <div className="relative z-10 mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-amber-600">
                      Lịch hạn chót <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-slate-400">Trong 7 ngày</span>
                  </div>
                </Link>
              </motion.div>

              {/* Thẻ Số Dư Tài Chính */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Link
                  to="/tai-chinh"
                  className="group relative block bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Ngân sách
                      </span>
                      <h3 className="text-base font-semibold text-slate-800 mt-0.5">Số dư tháng này</h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="relative z-10 mt-5 flex items-baseline gap-2">
                    <span
                      className={`font-display text-3xl sm:text-4xl font-extrabold tracking-tight ${
                        soDuDuong ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {thongKeTaiChinh ? dinhDangTien(thongKeTaiChinh.soDu) : '--'}
                    </span>
                  </div>

                  <div className="relative z-10 mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                      Quản lý chi tiêu <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-slate-400">Tháng hiện tại</span>
                  </div>
                </Link>
              </motion.div>
            </div>

            {/* Khối Cảnh Báo Khẩn (Nếu có) */}
            {monNguyCo.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-2xl p-5 shadow-xs"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-rose-900 text-sm sm:text-base">
                    Cảnh báo học tập: {monNguyCo.length} môn có nguy cơ điểm thấp
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {monNguyCo.map((mon, i) => (
                    <span
                      key={i}
                      className="text-xs sm:text-sm bg-white px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 font-medium shadow-xs inline-flex items-center gap-1.5"
                    >
                      <span>{mon.ten}:</span>
                      <strong className="text-rose-800 font-bold">{mon.diemHienTai}</strong>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {nganSachVuot.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-2xl p-5 shadow-xs"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-amber-900 text-sm sm:text-base">
                    Cảnh báo ngân sách: {nganSachVuot.length} danh mục đã chi tiêu vượt định mức
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {nganSachVuot.map((ns, i) => (
                    <span
                      key={i}
                      className="text-xs sm:text-sm bg-white px-3 py-1.5 rounded-xl border border-amber-200 text-amber-700 font-medium capitalize shadow-xs"
                    >
                      {ns.danhMuc.replace('_', ' ')}:{' '}
                      <span className="font-bold text-amber-900">{dinhDangTien(ns.daChi)}</span> /{' '}
                      {dinhDangTien(ns.soTienToiDa)}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Bảng Danh Sách: Deadline & Chi Tiêu */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Deadline sắp tới */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <h2 className="font-semibold text-slate-800 text-base">Deadline cần nộp</h2>
                    </div>
                    <Link
                      to="/deadline"
                      className="text-xs font-semibold text-ink-600 hover:text-ink-700 flex items-center transition-colors group"
                    >
                      Xem lịch <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  {deadlinesSapToi.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Tuyệt vời! Không có deadline gấp</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Bạn đã hoàn thành các công việc hoặc chưa có bài tập mới nào trong 7 ngày tới.
                      </p>
                      <Link
                        to="/deadline"
                        className="mt-4 text-xs font-medium text-ink-600 bg-ink-50 px-3 py-1.5 rounded-lg hover:bg-ink-100 transition-colors"
                      >
                        + Tạo deadline mới
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {deadlinesSapToi.slice(0, 5).map((d) => (
                        <div
                          key={d.id}
                          className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-sm font-medium text-slate-700 truncate">
                              {d.tieuDe}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg shrink-0 ml-2">
                            {dinhDangNgay(d.hanChot)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Chi tiêu tháng này */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h2 className="font-semibold text-slate-800 text-base">Chi tiêu tháng này</h2>
                    </div>
                    <Link
                      to="/tai-chinh"
                      className="text-xs font-semibold text-ink-600 hover:text-ink-700 flex items-center transition-colors group"
                    >
                      Sổ chi tiêu <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  {!thongKeTaiChinh || Object.keys(thongKeTaiChinh?.theoDanhMuc || {}).length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Chưa có chi tiêu nào</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Bắt đầu ghi lại các khoản chi tiêu hàng ngày để kiểm soát tài chính tốt hơn.
                      </p>
                      <Link
                        to="/tai-chinh"
                        className="mt-4 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        + Ghi khoản chi
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {Object.entries(thongKeTaiChinh?.theoDanhMuc || {}).slice(0, 5).map(([danhMuc, soTien]) => (
                        <div
                          key={danhMuc}
                          className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100"
                        >
                          <span className="capitalize text-sm font-medium text-slate-700">
                            {danhMuc.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {dinhDangTien(soTien)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Khu Vực Biểu Đồ Trực Quan (Charts) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Biểu đồ tròn chi tiêu */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-800 text-base">Cơ cấu chi tiêu</h2>
                  <span className="text-xs text-slate-400 font-medium">Theo danh mục</span>
                </div>
                {!thongKeTaiChinh || Object.keys(thongKeTaiChinh?.theoDanhMuc || {}).length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                    Chưa có đủ dữ liệu để vẽ biểu đồ.
                  </div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
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
                          outerRadius={80}
                          innerRadius={52}
                          stroke="none"
                          paddingAngle={3}
                        >
                          {Object.keys(thongKeTaiChinh.theoDanhMuc).map((_, index) => (
                            <Cell key={index} fill={MAU_DANH_MUC[index % MAU_DANH_MUC.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => dinhDangTien(value)}
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontSize: '13px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>

              {/* Biểu đồ cột GPA theo kỳ */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-800 text-base">Xu hướng GPA theo kỳ</h2>
                  <span className="text-xs text-slate-400 font-medium">Thang điểm 4</span>
                </div>
                {gpaTheoKy.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                    Chưa có điểm học kỳ nào để hiển thị.
                  </div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gpaTheoKy} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis
                          dataKey="hocKy"
                          tick={{ fontSize: 12, fill: '#94A3B8' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 4]}
                          tick={{ fontSize: 12, fill: '#94A3B8' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontSize: '13px',
                          }}
                        />
                        <Bar
                          dataKey="gpa"
                          fill="#3D3F72"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={44}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}

export default Dashboard;
