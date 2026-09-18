import { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react';
import { taoLich, khoaNgay, badgeUuTien, textUuTien } from './deadlineUtils';

function DeadlineCalendarView({
  thangXemLich,
  ngayDuocChon,
  danhSach = [],
  onChonNgay,
  onDoiThang,
  onHoanThanh,
  onSua,
  onXoa,
}) {
  const lichDuocMemo = useMemo(() => taoLich(thangXemLich), [thangXemLich]);
  const homNay = new Date();

  const deadlinesNgayDuocChon = ngayDuocChon
    ? danhSach.filter((d) => khoaNgay(new Date(d.hanChot)) === khoaNgay(ngayDuocChon))
    : [];

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
        {/* Thanh điều hướng tháng */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => onDoiThang(-1)}
            aria-label="Xem tháng trước"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h2 className="font-display text-lg font-bold text-slate-800 dark:text-slate-200">
            Tháng {thangXemLich.getMonth() + 1} - {thangXemLich.getFullYear()}
          </h2>
          <button
            onClick={() => onDoiThang(1)}
            aria-label="Xem tháng sau"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Tiêu đề các thứ trong tuần */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((thu) => (
            <div key={thu} className="text-center py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {thu}
            </div>
          ))}
        </div>

        {/* Ma trận 42 ô ngày */}
        <div className="grid grid-cols-7">
          {lichDuocMemo.map((ngay, i) => {
            const ds = danhSach.filter((d) => khoaNgay(new Date(d.hanChot)) === khoaNgay(ngay));
            const laHomNay = khoaNgay(ngay) === khoaNgay(homNay);
            const dangDuocChon = ngayDuocChon && khoaNgay(ngay) === khoaNgay(ngayDuocChon);
            const khacThang = ngay.getMonth() !== thangXemLich.getMonth();

            return (
              <button
                key={i}
                onClick={() => onChonNgay(ngay)}
                className={`min-h-[100px] p-2 border-b border-r border-slate-100 dark:border-slate-700/30 text-left align-top hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                  dangDuocChon
                    ? 'bg-ink-50/50 dark:bg-ink-900/30 border-ink-200 dark:border-ink-700 ring-1 ring-inset ring-ink-400'
                    : ''
                } ${khacThang ? 'bg-slate-50/50 dark:bg-slate-900/20' : 'bg-white dark:bg-slate-800'}`}
              >
                <span
                  className={`text-xs inline-flex items-center justify-center w-6 h-6 rounded-full font-medium mb-1 ${
                    laHomNay
                      ? 'bg-ink-600 text-white shadow-sm'
                      : khacThang
                      ? 'text-slate-300 dark:text-slate-600'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {ngay.getDate()}
                </span>
                <div className="space-y-1 mt-1">
                  {ds.slice(0, 3).map((d) => (
                    <div
                      key={d.id}
                      className={`text-[10px] truncate px-1.5 py-0.5 rounded font-medium ${
                        d.trangThai === 'hoan_thanh'
                          ? 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500 line-through'
                          : badgeUuTien(d.doUuTien)
                      }`}
                      title={d.tieuDe}
                    >
                      {d.tieuDe}
                    </div>
                  ))}
                  {ds.length > 3 && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-1">
                      +{ds.length - 3} công việc
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chi tiết deadline của ngày được chọn */}
      {ngayDuocChon && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
          <h3 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-ink-500" />
            Công việc ngày {ngayDuocChon.toLocaleDateString('vi-VN')}
          </h3>
          {deadlinesNgayDuocChon.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mb-2 text-slate-200 dark:text-slate-700" />
              <p>Trống! Bạn có thể thư giãn vào ngày này.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deadlinesNgayDuocChon.map((d) => (
                <div
                  key={d.id}
                  className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 group hover:border-slate-300 transition-colors"
                >
                  <button
                    onClick={() => onHoanThanh(d.id, d.trangThai === 'hoan_thanh')}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {d.trangThai === 'hoan_thanh' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600 hover:text-ink-500 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`font-semibold truncate ${
                          d.trangThai === 'hoan_thanh'
                            ? 'text-slate-400 line-through'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {d.tieuDe}
                      </h4>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${badgeUuTien(
                          d.doUuTien
                        )}`}
                      >
                        {textUuTien(d.doUuTien)}
                      </span>
                    </div>
                    {d.moTa && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{d.moTa}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(d.hanChot).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onSua(d)}
                      className="p-1.5 text-slate-400 hover:text-ink-600 dark:hover:text-ink-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onXoa(d)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default DeadlineCalendarView;
