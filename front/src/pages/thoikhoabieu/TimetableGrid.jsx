import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import { Clock, MapPin, User, Edit2, Trash2, CalendarClock } from 'lucide-react';
import { CAC_THU, mauChoMon } from './timetableUtils';

const SESSIONS = [
  { key: 'sang', label: 'Sáng', hint: '06:00 – 12:00', match: time => time < '12:00' },
  { key: 'chieu', label: 'Chiều', hint: '12:00 – 18:00', match: time => time >= '12:00' && time < '18:00' },
  { key: 'toi', label: 'Tối', hint: '18:00 – 23:59', match: time => time >= '18:00' },
];

function TimetableCard({ bh, onSua, onXoa, onDieuChinh, readOnly, disabled }) {
  useLanguage();
  return (
    <div
      className={`group relative flex flex-col rounded-xl p-3 border transition-all hover:-translate-y-0.5 hover:shadow-md ${mauChoMon(
        bh.tenMon
      )}`}
    >
      <h4 className="font-bold text-sm leading-snug mb-2 break-words [overflow-wrap:anywhere]">{bh.tenMon}</h4>
      <div className="space-y-1.5 text-xs font-medium opacity-90">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{bh.gioBatDau} – {bh.gioKetThuc}</span>
        </div>
        {bh.phongHoc && (
          <div className="flex min-w-0 items-start gap-1.5">
            <MapPin className="mt-0.5 w-3.5 h-3.5 shrink-0" />
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{bh.phongHoc}</span>
          </div>
        )}
        {bh.giangVien && (
          <div className="flex min-w-0 items-start gap-1.5">
            <User className="mt-0.5 w-3.5 h-3.5 shrink-0" />
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{bh.giangVien}</span>
          </div>
        )}
      </div>

      {bh.daDieuChinh && <p className="mt-2 text-[11px] font-semibold">{tr("Đã đổi riêng ngày ")}{bh.ngayHoc}</p>}

      {!readOnly && (
        <div className="mt-2.5 flex justify-end gap-1 border-t border-current/10 pt-2">
          {onDieuChinh && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onDieuChinh(bh)}
              title={tr("Nghỉ hoặc đổi riêng ngày này")}
              aria-label={tr('Điều chỉnh ngày ') + bh.tenMon}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/60 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 transition-colors"
            >
              <CalendarClock className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSua?.(bh)}
            title={tr("Sửa")}
            aria-label={tr("Sửa buổi học {0}", bh.tenMon)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/60 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 shadow-sm text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onXoa?.(bh)}
            title={tr("Xóa")}
            aria-label={tr("Xóa buổi học {0}", bh.tenMon)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/60 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 shadow-sm text-rose-600 dark:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function TimetableGrid({ buoiTheoThu = {}, onSua, onXoa, onDieuChinh, readOnly = false, disabled = false }) {
  useLanguage();
  const activeSessions = SESSIONS.filter(session =>
    CAC_THU.some(day => (buoiTheoThu[day.gia] || []).some(item => session.match(item.gioBatDau || '07:00')))
  );
  const rows = activeSessions.length ? activeSessions : SESSIONS.slice(0, 2);

  // Give active study days wider columns and compact empty days so room & lecturer names stay legible.
  const columnTemplate = `78px ${CAC_THU.map(day => ((buoiTheoThu[day.gia] || []).length > 0 ? 'minmax(0, 1.45fr)' : 'minmax(64px, 0.5fr)')).join(' ')}`;

  return (
    <div className="hidden md:block overflow-x-auto">
      <div className="min-w-[820px]">
        {/* Hàng tiêu đề các thứ */}
        <div
          className="grid border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50"
          style={{ gridTemplateColumns: columnTemplate }}
        >
          <div className="flex items-center justify-center py-3.5 px-2 border-r border-slate-200 dark:border-slate-700/60">
            <span className="font-display font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">{tr("Buổi")}</span>
          </div>
          {CAC_THU.map((t) => {
            const hasClass = (buoiTheoThu[t.gia] || []).length > 0;
            return (
              <div
                key={t.gia}
                className="text-center py-3.5 px-1.5 border-r last:border-r-0 border-slate-200 dark:border-slate-700/60"
              >
                <span className={`font-display font-semibold text-sm ${hasClass ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                  {tr(t.ten)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Các hàng theo buổi Sáng / Chiều / Tối */}
        <div className="divide-y divide-slate-200 dark:divide-slate-700/60">
          {rows.map((session) => (
            <div
              key={session.key}
              className="grid"
              style={{ gridTemplateColumns: columnTemplate }}
            >
              <div className="flex flex-col items-center justify-center p-2 border-r border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/30 text-center">
                <span className="font-display text-xs font-bold text-slate-700 dark:text-slate-200">{tr(session.label)}</span>
                <span className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{session.hint}</span>
              </div>

              {CAC_THU.map((t) => {
                const buois = (buoiTheoThu[t.gia] || []).filter(item => session.match(item.gioBatDau || '07:00'));
                const dayHasAny = (buoiTheoThu[t.gia] || []).length > 0;
                return (
                  <div
                    key={t.gia}
                    className={`min-h-[140px] border-r last:border-r-0 border-slate-200 dark:border-slate-700/60 p-2 transition-colors ${
                      dayHasAny ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/40 dark:bg-slate-900/20'
                    }`}
                  >
                    {buois.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-300 dark:text-slate-700 text-xs select-none">
                        —
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {buois.map((bh) => (
                          <TimetableCard
                            key={bh.occurrenceId || bh.id}
                            bh={bh}
                            onSua={onSua}
                            onXoa={onXoa}
                            onDieuChinh={onDieuChinh}
                            readOnly={readOnly}
                            disabled={disabled}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TimetableGrid;
