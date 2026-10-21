import DeadlineDueInput from '../../components/DeadlineDueInput';

const inputStyle = 'min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white';
export default function DeadlineForm({ hienFormThem, dangSuaId, tieuDe, hanChot, doUuTien, onTieuDeChange, onHanChotChange, onDoUuTienChange, onSubmit, saving = false, onCancel }) {
  if (!hienFormThem) return null;
  return <form onSubmit={onSubmit} aria-label={dangSuaId ? 'Sửa deadline' : 'Tạo deadline'} className="rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-500/40 dark:bg-slate-800 sm:p-6">
    <h3 className="mb-5 text-lg font-semibold text-slate-800 dark:text-slate-200">{dangSuaId ? 'Cập nhật deadline' : 'Tạo deadline mới'}</h3>
    <fieldset disabled={saving} className="space-y-4">
      <div><label htmlFor="deadline-title" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Tên công việc</label><input id="deadline-title" value={tieuDe} onChange={event => onTieuDeChange(event.target.value)} maxLength={200} placeholder="Ví dụ: Nộp báo cáo đồ án" required className={inputStyle} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DeadlineDueInput value={hanChot} onValueChange={onHanChotChange} />
        <div><label htmlFor="deadline-priority" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Độ ưu tiên</label><select id="deadline-priority" value={doUuTien} onChange={event => onDoUuTienChange(event.target.value)} className={inputStyle}><option value="thap">Thấp</option><option value="binh_thuong">Bình thường</option><option value="cao">Khẩn cấp</option></select></div>
      </div>
      <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onCancel} className="min-h-11 rounded-xl px-4 text-sm text-slate-600 dark:text-slate-300">Hủy</button><button type="submit" aria-busy={saving} className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : dangSuaId ? 'Cập nhật' : 'Lưu công việc'}</button></div>
    </fieldset>
  </form>;
}
