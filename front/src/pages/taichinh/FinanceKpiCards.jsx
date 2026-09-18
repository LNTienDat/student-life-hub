import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { dinhDangTien } from '../../utils/formatters';

function FinanceKpiCards({ thongKe }) {
  if (!thongKe) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <TrendingUp className="w-20 h-20 text-emerald-500" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 relative z-10">Tổng thu</p>
        <p className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400 relative z-10">
          {dinhDangTien(thongKe.tongThu)}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <TrendingDown className="w-20 h-20 text-rose-500" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 relative z-10">Tổng chi</p>
        <p className="font-display text-3xl font-bold text-rose-600 dark:text-rose-400 relative z-10">
          {dinhDangTien(thongKe.tongChi)}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Wallet className="w-20 h-20 text-ink-500 dark:text-ink-400" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 relative z-10">Số dư hiện tại</p>
        <p
          className={`font-display text-3xl font-bold relative z-10 ${
            thongKe.soDu >= 0 ? 'text-ink-600 dark:text-ink-300' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {dinhDangTien(thongKe.soDu)}
        </p>
      </div>
    </div>
  );
}

export default FinanceKpiCards;
