import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { dinhDangTien } from '../../utils/formatters';

export default function DashboardWarnings({ monNguyCo, nganSachVuot, itemVariants }) {
  if (monNguyCo.length === 0 && nganSachVuot.length === 0) return null;

  return (
    <>
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
    </>
  );
}
