import { PieChart as PieChartIcon } from 'lucide-react';
import { TEN_DANH_MUC } from '../../constants';
import { dinhDangTien } from '../../utils/formatters';

function BudgetSection({ nganSachs = [], thongKe, onQuickTransaction }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-amber-500" />
          Ngân sách tháng này
        </h2>
      </div>

      <div className="space-y-5 flex-1">
        {nganSachs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            Chưa thiết lập ngân sách
          </div>
        ) : (
          nganSachs.map((ns) => {
            const daChi = (thongKe?.theoDanhMuc && thongKe.theoDanhMuc[ns.danhMuc]) || 0;
            const phanTram = ns.hanMuc > 0 ? (daChi / ns.hanMuc) * 100 : 0;
            const vuotNgay = phanTram > 100;
            const canhBao = phanTram >= 80 && !vuotNgay;

            return (
              <div
                key={ns.id}
                className="group cursor-pointer"
                onClick={() => onQuickTransaction && onQuickTransaction(ns.danhMuc)}
              >
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-ink-600 dark:group-hover:text-ink-300 transition-colors">
                    {TEN_DANH_MUC[ns.danhMuc] || ns.danhMuc}
                  </span>
                  <span
                    className={`font-medium ${
                      vuotNgay
                        ? 'text-rose-600 dark:text-rose-400'
                        : canhBao
                        ? 'text-amber-500'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {dinhDangTien(daChi)} / {dinhDangTien(ns.hanMuc)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      vuotNgay ? 'bg-rose-500' : canhBao ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(phanTram, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default BudgetSection;
