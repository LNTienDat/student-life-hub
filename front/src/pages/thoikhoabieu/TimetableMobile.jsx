import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import { Clock, MapPin, User, Edit2, Trash2, CalendarClock } from 'lucide-react';
import { CAC_THU, mauChoMon } from './timetableUtils';

function TimetableMobile({ buoiTheoThu = {}, onSua, onXoa, onDieuChinh, readOnly = false, disabled = false }) {
  useLanguage();
  return (
    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/60">
      {CAC_THU.map((t) => {
        const buois = buoiTheoThu[t.gia] || [];
        if (buois.length === 0) return null;
        return (
          <div key={t.gia} className="p-4">
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm text-slate-600 dark:text-slate-300">
                {tr(t.tat)}
              </span>
              {tr(t.ten)}
            </h3>
            <div className="space-y-3">
              {buois.map((bh) => (
                <div key={bh.occurrenceId||bh.id} className={`relative rounded-xl p-3 border ${mauChoMon(bh.tenMon)}`}>
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <h4 className="min-w-0 basis-full flex-1 break-words [overflow-wrap:anywhere] font-bold text-base leading-tight">{bh.tenMon}</h4>

                  </div>
                  {bh.daDieuChinh&&<p className="mt-2 text-xs font-semibold">{tr("Đã đổi riêng ngày ")}{bh.ngayHoc}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm font-medium opacity-90 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 shrink-0" />
                      {bh.gioBatDau} - {bh.gioKetThuc}
                    </div>
                    {bh.phongHoc && (
                      <div className="flex min-w-0 items-start gap-1.5">
                        <MapPin className="mt-0.5 w-4 h-4 shrink-0" />
                        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{bh.phongHoc}</span>
                      </div>
                    )}
                    {bh.giangVien && (
                      <div className="flex items-center gap-1.5 sm:col-span-2 truncate">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{bh.giangVien}</span>
                      </div>
                    )}
                  </div>
                    {!readOnly && <div className="flex shrink-0 items-center justify-end gap-1 border-t border-current/10 pt-2 mt-3">
                      {onDieuChinh&&<button type="button" disabled={disabled} onClick={()=>onDieuChinh(bh)} aria-label={tr('Điều chỉnh ngày ')+bh.tenMon} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-white/50 dark:hover:bg-black/20"><CalendarClock className="h-4 w-4"/></button>}
                      <button type="button" disabled={disabled}
                        onClick={() => onSua?.(bh)}
                        aria-label={tr("Sửa buổi học {0}", bh.tenMon)}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" disabled={disabled}
                        onClick={() => onXoa?.(bh)}
                        aria-label={tr("Xóa buổi học {0}", bh.tenMon)}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg text-rose-600 dark:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TimetableMobile;
