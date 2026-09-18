import { Calendar as CalendarIcon, Clock, MapPin, User, Edit2, Trash2 } from 'lucide-react';
import { CAC_THU, mauChoMon } from './timetableUtils';

function TimetableGrid({ buoiTheoThu = {}, onSua, onXoa }) {
  return (
    <>
      {/* Hàng tiêu đề các thứ (Desktop) */}
      <div className="hidden md:grid grid-cols-7 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50">
        {CAC_THU.map((t) => (
          <div
            key={t.gia}
            className="text-center py-4 border-r last:border-r-0 border-slate-200 dark:border-slate-700/60"
          >
            <span className="font-display font-semibold text-slate-700 dark:text-slate-300 text-sm">{t.ten}</span>
          </div>
        ))}
      </div>

      {/* Cột dữ liệu các thứ (Desktop) */}
      <div className="hidden md:grid grid-cols-7">
        {CAC_THU.map((t) => {
          const buois = buoiTheoThu[t.gia] || [];
          return (
            <div
              key={t.gia}
              className="min-h-[400px] border-r last:border-r-0 border-slate-200 dark:border-slate-700/60 p-2 bg-white dark:bg-slate-800"
            >
              <div className="space-y-3 h-full">
                {buois.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 py-10 opacity-50">
                    <CalendarIcon className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">Trống</span>
                  </div>
                ) : (
                  buois.map((bh) => (
                    <div
                      key={bh.id}
                      className={`group relative rounded-xl p-3 border transition-all hover:-translate-y-0.5 hover:shadow-md ${mauChoMon(
                        bh.tenMon
                      )}`}
                    >
                      <h4 className="font-bold text-sm leading-tight mb-2 pr-4">{bh.tenMon}</h4>
                      <div className="space-y-1.5 text-xs font-medium opacity-90">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {bh.gioBatDau} - {bh.gioKetThuc}
                        </div>
                        {bh.phongHoc && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {bh.phongHoc}
                          </div>
                        )}
                        {bh.giangVien && (
                          <div className="flex items-center gap-1.5 truncate" title={bh.giangVien}>
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{bh.giangVien}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions hover */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={() => onSua(bh)}
                          aria-label={`Sửa buổi học ${bh.tenMon}`}
                          className="p-1 bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 rounded shadow-sm text-slate-700 dark:text-slate-200"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onXoa(bh)}
                          aria-label={`Xóa buổi học ${bh.tenMon}`}
                          className="p-1 bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 rounded shadow-sm text-rose-600 dark:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default TimetableGrid;
