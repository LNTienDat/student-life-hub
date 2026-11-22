import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import ModalDialog from '../../components/ModalDialog';

function SubjectForm({
  hienFormThem,
  dangSuaId,
  tenMon,
  tinChi,
  hocKy,
  onTenMonChange,
  onTinChiChange,
  onHocKyChange,
  onSubmit,
  onCancel,
  saving = false,
}) {
  useLanguage();
  if (!hienFormThem) return null;

  return (
    <ModalDialog
      open={hienFormThem}
      onClose={onCancel}
      busy={saving}
      title={dangSuaId ? 'Cập nhật môn học' : 'Thêm môn học mới'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="subject-name" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">{tr("Tên môn học")}</label>
          <input
            id="subject-name"
            type="text"
            maxLength={100}
            value={tenMon}
            onChange={(e) => onTenMonChange(e.target.value)}
            placeholder={tr("VD: Toán cao cấp")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-shadow focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="subject-credits" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">{tr("Tín chỉ")}</label>
            <input
              id="subject-credits"
              type="number"
              value={tinChi}
              onChange={(e) => onTinChiChange(e.target.value)}
              min="1"
              max="20"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-shadow focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="subject-semester" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">{tr("Học kỳ")}</label>
            <input
              id="subject-semester"
              type="text"
              maxLength={100}
              value={hocKy}
              onChange={(e) => onHocKyChange(e.target.value)}
              placeholder="VD: HK1 2025-2026"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-shadow focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className="min-h-11 rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {tr("Hủy bỏ")}
          </button>
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving}
            className="min-h-11 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {dangSuaId ? tr('Cập nhật') : tr('Lưu môn học')}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}

export default SubjectForm;
