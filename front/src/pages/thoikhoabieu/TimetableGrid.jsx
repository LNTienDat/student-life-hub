import { Calendar as CalendarIcon, Clock, MapPin, User, Edit2, Trash2, CalendarClock } from 'lucide-react';
import { CAC_THU, mauChoMon } from './timetableUtils';

function TimetableGrid({ buoiTheoThu = {}, onSua, onXoa, onDieuChinh, readOnly = false, disabled = false }) {
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
                      key={bh.occurrenceId||bh.id}
                      className={`group relative rounded-xl p-3 border transition-all hover:-translate-y-0.5 hover:shadow-md ${mauChoMon(
                        bh.tenMon
                      )}`}
                    >
                      <h4 className="font-bold text-sm leading-tight mb-2 break-words [overflow-wrap:anywhere]">{bh.tenMon}</h4>
                      <div className="space-y-1.5 text-xs font-medium opacity-90">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {bh.gioBatDau} - {bh.gioKetThuc}
                        </div>
                        {bh.phongHoc && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{bh.phongHoc}</span>
                          </div>
                        )}
                        {bh.giangVien && (
                          <div className="flex items-center gap-1.5 truncate" title={bh.giangVien}>
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{bh.giangVien}</span>
                          </div>
                        )}
                      </div>

                      {bh.daDieuChinh&&<p className="mt-2 text-xs font-semibold">Đã đổi riêng ngày {bh.ngayHoc}</p>}
                      {/* Actions hover */}
                      {!readOnly && <div className="mt-3 flex justify-end gap-1 border-t border-current/10 pt-2">
                        {onDieuChinh&&<button type="button" disabled={disabled} onClick={()=>onDieuChinh(bh)} title="Nghỉ hoặc đổi riêng ngày này" aria-label={'Điều chỉnh ngày '+bh.tenMon} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded bg-white/50 dark:bg-black/20"><CalendarClock className="h-4 w-4"/></button>}
                        <button type="button" disabled={disabled}
                          onClick={() => onSua?.(bh)}
                          aria-label={`Sửa buổi học ${bh.tenMon}`}
                          className="inline-flex min-h-9 min-w-9 items-center justify-center p-1 bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 rounded shadow-sm text-slate-700 dark:text-slate-200"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button type="button" disabled={disabled}
                          onClick={() => onXoa?.(bh)}
                          aria-label={`Xóa buổi học ${bh.tenMon}`}
                          className="inline-flex min-h-9 min-w-9 items-center justify-center p-1 bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 rounded shadow-sm text-rose-600 dark:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>}
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
