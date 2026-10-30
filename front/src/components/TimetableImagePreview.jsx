import { Trash2 } from 'lucide-react';
import { CAC_THU } from '../pages/thoikhoabieu/timetableUtils';

const inputStyle = 'mt-1 min-h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white';

export default function TimetableImagePreview({ rows, checks, saving, onUpdate, onRemove }) {
  return <fieldset disabled={saving} className="space-y-3" aria-label="Chỉnh sửa lịch nhận diện">
    {rows.map((row, index) => <article key={row.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-600">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="min-w-0">
          <span className="sr-only">Thứ</span>
          <select aria-label="Thứ" value={row.thu} onChange={event => onUpdate(row.id, 'thu', event.target.value)}
            className="min-h-11 max-w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
            <option value="">Chọn thứ</option>{CAC_THU.map(day => <option key={day.gia} value={day.gia}>{day.ten}</option>)}
          </select>
        </label>
        <div className="flex shrink-0 items-center gap-1">
          <label className="inline-flex h-11 w-11 items-center justify-center"><input type="checkbox" checked={row.selected} onChange={event => onUpdate(row.id, 'selected', event.target.checked)}/><span className="sr-only">Chọn {row.tenMon || 'buổi học'}</span></label>
          <button type="button" onClick={() => onRemove(row.id)} aria-label={`Bỏ ${row.tenMon || 'buổi học'}`} className="inline-flex h-11 w-11 items-center justify-center text-rose-600"><Trash2 aria-hidden="true" className="h-4 w-4"/></button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="sm:col-span-2">Tên môn<input value={row.tenMon} maxLength={100} onChange={event => onUpdate(row.id, 'tenMon', event.target.value)} className={inputStyle}/></label>
        <label>Bắt đầu<input type="time" value={row.gioBatDau} onChange={event => onUpdate(row.id, 'gioBatDau', event.target.value)} className={inputStyle}/></label>
        <label>Kết thúc<input type="time" value={row.gioKetThuc} onChange={event => onUpdate(row.id, 'gioKetThuc', event.target.value)} className={inputStyle}/></label>
        <label className="sm:col-span-2">Phòng<input value={row.phongHoc} maxLength={50} onChange={event => onUpdate(row.id, 'phongHoc', event.target.value)} className={inputStyle}/></label>
        <label className="sm:col-span-2">Giảng viên<input value={row.giangVien} maxLength={100} onChange={event => onUpdate(row.id, 'giangVien', event.target.value)} className={inputStyle}/></label>
      </div>
      {row.spellingAdjusted && <p className="mt-2 text-slate-500 dark:text-slate-300">Đã gợi ý sửa chính tả tên môn. Kiểm tra lại với ảnh gốc trước khi lưu.</p>}
      {row.timeUncertain && (!row.gioBatDau || !row.gioKetThuc) && <p className="mt-2 text-amber-700 dark:text-amber-300">Chưa đọc chắc giờ học. Hãy kiểm tra và điền lại theo ảnh gốc.</p>}
      {row.warning && <p className="mt-2 text-amber-700 dark:text-amber-300">{row.warning}</p>}
      {checks[index].duplicate && row.selected && <p className="mt-2 text-slate-500">Buổi này đã có, sẽ bỏ qua.</p>}
      {checks[index].errors.length > 0 && <p role="alert" className="mt-2 text-rose-600 dark:text-rose-300">{checks[index].errors.join(' ')}</p>}
    </article>)}
  </fieldset>;
}
