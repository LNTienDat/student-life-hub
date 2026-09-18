import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, CalendarDays, Wallet, ArrowUpRight } from 'lucide-react';
import { dinhDangTien } from '../../utils/formatters';

export default function DashboardKpiCards({ gpa, deadlinesSapToi, thongKeTaiChinh, itemVariants }) {
  const soDuDuong = (thongKeTaiChinh?.soDu ?? 0) >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Thẻ GPA */}
      <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
        <Link
          to="/mon-hoc"
          className="group relative block bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-ink-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Học tập</span>
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
      <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
        <Link
          to="/deadline"
          className="group relative block bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Tiến độ</span>
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
      <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
        <Link
          to="/tai-chinh"
          className="group relative block bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Ngân sách</span>
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
  );
}
