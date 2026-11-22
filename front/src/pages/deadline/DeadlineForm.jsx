import { Cpu } from 'lucide-react';
import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import ModalDialog from '../../components/ModalDialog';
import DeadlineDueInput from '../../components/DeadlineDueInput';

const inputStyle = 'min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white';
const PRIORITY_LABELS = {
  cao: 'Khẩn cấp',
  binh_thuong: 'Bình thường',
  thap: 'Thấp',
};

export default function DeadlineForm({
  hienFormThem,
  dangSuaId,
  tieuDe,
  hanChot,
  doUuTien,
  onTieuDeChange,
  onHanChotChange,
  onDoUuTienChange,
  onSubmit,
  saving = false,
  onCancel,
  edgePrediction = null,
  onApplyEdgePrediction = null,
}) {
  useLanguage();
  if (!hienFormThem) return null;

  const pct = edgePrediction ? Math.round(edgePrediction.confidence * 100) : 0;
  const edgePriorityLabel = edgePrediction ? tr(PRIORITY_LABELS[edgePrediction.label] || edgePrediction.label) : '';
  const showEdge = Boolean(edgePrediction && edgePrediction.confidence >= 0.42);

  return (
    <ModalDialog
      open={hienFormThem}
      onClose={onCancel}
      busy={saving}
      title={dangSuaId ? 'Cập nhật deadline' : 'Tạo deadline mới'}
    >
      <form onSubmit={onSubmit} aria-label={dangSuaId ? tr('Sửa deadline') : tr('Tạo deadline')}>
        <fieldset disabled={saving} className="space-y-4">
          <div>
            <label htmlFor="deadline-title" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">{tr("Tên công việc")}</label>
            <input
              id="deadline-title"
              value={tieuDe}
              onChange={(event) => onTieuDeChange(event.target.value)}
              maxLength={200}
              placeholder={tr("Ví dụ: Nộp báo cáo đồ án")}
              required
              className={inputStyle}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DeadlineDueInput value={hanChot} onValueChange={onHanChotChange} />
            <div>
              <label htmlFor="deadline-priority" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">{tr("Độ ưu tiên")}</label>
              <select
                id="deadline-priority"
                value={doUuTien}
                onChange={(event) => onDoUuTienChange(event.target.value)}
                className={inputStyle}
              >
                <option value="thap">{tr("Thấp")}</option>
                <option value="binh_thuong">{tr("Bình thường")}</option>
                <option value="cao">{tr("Khẩn cấp")}</option>
              </select>
            </div>
          </div>
          {showEdge && (
            edgePrediction.label !== doUuTien ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-200/80 bg-violet-50/70 px-3 py-2 text-xs text-violet-900 dark:border-violet-800/70 dark:bg-violet-950/40 dark:text-violet-200">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-300" aria-hidden="true" />
                  <span>{tr("EdgeAI (trên máy · {0}ms): gợi ý", edgePrediction.latencyMs)}</span>
                  <strong className="font-semibold">{edgePriorityLabel}</strong>
                  <span>({pct}%)</span>
                  {edgePrediction.topFeatures?.length > 0 && (
                    <span className="text-violet-700/90 dark:text-violet-300/90">
                      · {edgePrediction.topFeatures.join(', ')}
                    </span>
                  )}
                </div>
                {onApplyEdgePrediction && (
                  <button
                    type="button"
                    onClick={onApplyEdgePrediction}
                    className="rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
                  >
                    {tr("Áp dụng")}
                  </button>
                )}
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{tr("EdgeAI khớp “{0}” · {1}% · {2}ms · offline", edgePriorityLabel, pct, edgePrediction.latencyMs)}</span>
              </p>
            )
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={onCancel}
              className="min-h-11 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {tr("Hủy")}
            </button>
            <button
              type="submit"
              aria-busy={saving}
              className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? tr('Đang lưu…') : dangSuaId ? tr('Cập nhật') : tr('Lưu công việc')}
            </button>
          </div>
        </fieldset>
      </form>
    </ModalDialog>
  );
}
