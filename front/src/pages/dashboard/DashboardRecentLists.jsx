import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle2, Clock, Inbox } from 'lucide-react';
import { dinhDangTien, dinhDangNgay } from '../../utils/formatters';

export default function DashboardRecentLists({ deadlinesSapToi, thongKeTaiChinh, itemVariants }) {
  return (
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
  );
}
