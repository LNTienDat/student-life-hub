import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import { Trash2 } from 'lucide-react';
import { CAC_THU } from '../pages/thoikhoabieu/timetableUtils';

const inputStyle = 'mt-1 min-h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white';

export default function TimetableImagePreview({ rows, checks, saving, onUpdate, onRemove }) {
  useLanguage();
  return <fieldset disabled={saving} className="space-y-3" aria-label={tr("Chỉnh sửa lịch nhận diện")}>
    {rows.map((row, index) => <article key={row.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-600">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="min-w-0">
          <span className="sr-only">{tr("Thứ")}</span>
          <select aria-label={tr("Thứ")} value={row.thu} onChange={event => onUpdate(row.id, 'thu', event.target.value)}
            className="min-h-11 max-w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
            <option value="">{tr("Chọn thứ")}</option>{CAC_THU.map(day => <option key={day.gia} value={day.gia}>{tr(day.ten)}</option>)}
          </select>
        </label>
        <div className="flex shrink-0 items-center gap-1">
          <label className="inline-flex h-11 w-11 items-center justify-center"><input type="checkbox" checked={row.selected} onChange={event => onUpdate(row.id, 'selected', event.target.checked)}/><span className="sr-only">{tr("Chọn ")}{row.tenMon || tr('buổi học')}</span></label>
          <button type="button" onClick={() => onRemove(row.id)} aria-label={tr("Bỏ {0}", row.tenMon || 'buổi học')} className="inline-flex h-11 w-11 items-center justify-center text-rose-600"><Trash2 aria-hidden="true" className="h-4 w-4"/></button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="sm:col-span-2">{tr("Tên môn")}<input value={row.tenMon} maxLength={100} onChange={event => onUpdate(row.id, 'tenMon', event.target.value)} className={inputStyle}/></label>
        <label>{tr("Bắt đầu")}<input type="time" value={row.gioBatDau} onChange={event => onUpdate(row.id, 'gioBatDau', event.target.value)} className={inputStyle}/></label>
        <label>{tr("Kết thúc")}<input type="time" value={row.gioKetThuc} onChange={event => onUpdate(row.id, 'gioKetThuc', event.target.value)} className={inputStyle}/></label>
        <label className="sm:col-span-2">{tr("Phòng")}<input value={row.phongHoc} maxLength={50} onChange={event => onUpdate(row.id, 'phongHoc', event.target.value)} className={inputStyle}/></label>
        <label className="sm:col-span-2">{tr("Giảng viên")}<input value={row.giangVien} maxLength={100} onChange={event => onUpdate(row.id, 'giangVien', event.target.value)} className={inputStyle}/></label>
      </div>
      {row.spellingAdjusted && <p className="mt-2 text-slate-500 dark:text-slate-300">{tr("Đã gợi ý sửa chính tả tên môn. Kiểm tra lại với ảnh gốc trước khi lưu.")}</p>}
      {row.timeUncertain && (!row.gioBatDau || !row.gioKetThuc) && <p className="mt-2 text-amber-700 dark:text-amber-300">{tr("Chưa đọc chắc giờ học. Hãy kiểm tra và điền lại theo ảnh gốc.")}</p>}
      {row.warning && <p className="mt-2 text-amber-700 dark:text-amber-300">{tr(row.warning)}</p>}
      {checks[index].duplicate && row.selected && <p className="mt-2 text-slate-500">{tr("Buổi này đã có, sẽ bỏ qua.")}</p>}
      {checks[index].errors.length > 0 && <p role="alert" className="mt-2 text-rose-600 dark:text-rose-300">{checks[index].errors.map(value => tr(value)).join(' ')}</p>}
    </article>)}
  </fieldset>;
}
