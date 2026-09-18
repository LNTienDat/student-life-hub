import { AlertTriangle, CheckCircle2, Circle, Clock, Edit2, Trash2 } from 'lucide-react';
import { badgeUuTien, textUuTien } from './deadlineUtils';
import { dinhDangNgay } from '../../utils/formatters';

function DeadlineListView({
  dangDienHanh = [],
  daHoanThanh = [],
  onHoanThanh,
  onSua,
  onXoa,
}) {
  return (
    <div className="space-y-8">
      {/* Đang tiến hành */}
      <div>
        <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Cần hoàn thành ({dangDienHanh.length})
        </h2>

        {dangDienHanh.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-12 text-center text-slate-500">
            Bạn đã hoàn thành mọi công việc! Tuyệt vời!
          </div>
        ) : (
          <div className="grid gap-3">
            {dangDienHanh.map((d) => (
              <div
                key={d.id}
                className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-start gap-4 group hover:border-ink-300 dark:hover:border-ink-500 transition-colors"
              >
                <button
                  onClick={() => onHoanThanh(d.id, false)}
                  className="mt-0.5 flex-shrink-0"
                  title="Đánh dấu hoàn thành"
                  aria-label={`Đánh dấu hoàn thành: ${d.tieuDe}`}
                >
                  <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600 hover:text-emerald-500 hover:fill-emerald-50 transition-all" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-base">{d.tieuDe}</h3>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeUuTien(d.doUuTien)}`}>
                          {textUuTien(d.doUuTien)}
                        </span>
                      </div>
                      {d.moTa && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{d.moTa}</p>}
                    </div>

                    <div className="flex items-center gap-3 md:flex-col md:items-end">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Clock className="w-4 h-4 text-ink-500" />
                        {dinhDangNgay(d.hanChot)}
                      </div>
                    </div>
                  </div>

                  {d.monHoc && (
                    <div className="mt-3 inline-block">
                      <span className="text-xs bg-ink-50 text-ink-700 dark:bg-ink-900/40 dark:text-ink-200 px-2 py-1 rounded-md font-medium border border-ink-100 dark:border-ink-700/60">
                        Môn: {d.monHoc.ten}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0 ml-2">
                  <button
                    onClick={() => onSua(d)}
                    className="p-2 text-slate-400 hover:text-ink-600 dark:hover:text-ink-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Sửa"
                    aria-label={`Sửa deadline: ${d.tieuDe}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onXoa(d)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    title="Xóa"
                    aria-label={`Xóa deadline: ${d.tieuDe}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Đã hoàn thành */}
      {daHoanThanh.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-lg text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Đã hoàn thành ({daHoanThanh.length})
          </h2>
          <div className="grid gap-2 opacity-70 hover:opacity-100 transition-opacity">
            {daHoanThanh.map((d) => (
              <div
                key={d.id}
                className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 group"
              >
                <button
                  onClick={() => onHoanThanh(d.id, true)}
                  className="flex-shrink-0"
                  title="Hoàn tác"
                  aria-label={`Đánh dấu chưa hoàn thành: ${d.tieuDe}`}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-500 dark:text-slate-400 line-through truncate">{d.tieuDe}</h3>
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0 mr-4">{dinhDangNgay(d.hanChot)}</div>
                <button
                  onClick={() => onXoa(d)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity flex-shrink-0"
                  title="Xóa"
                  aria-label={`Xóa deadline: ${d.tieuDe}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DeadlineListView;
