import { Cpu } from 'lucide-react';
import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import MoneyInput from '../../components/MoneyInput';
import CategorySelect from '../../components/CategorySelect';


function TransactionForm({
  hienFormGD,
  loai,
  danhMuc,
  soTien,
  moTa,
  ngayGiaoDich,
  onLoaiChange,
  onDanhMucChange,
  onSoTienChange,
  onMoTaChange,
  onNgayGiaoDichChange,
  onSubmit,
  onCancel,
  dangLuu = false,
  editing = false,
  error = '',
  edgePrediction = null,
  edgeCategoryLabel = '',
  onApplyEdgePrediction = null,
}) {
  useLanguage();
  if (!hienFormGD) return null;

  const pct = edgePrediction ? Math.round(edgePrediction.confidence * 100) : 0;
  const showEdge = Boolean(edgePrediction && edgeCategoryLabel && edgePrediction.confidence >= 0.42);

  return (
    <div className="p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800">
      <h3 className="font-display font-semibold text-slate-800 dark:text-slate-200 mb-4">{editing ? tr('Sửa giao dịch') : tr('Thêm giao dịch mới')}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <fieldset disabled={dangLuu} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="finance-type" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Loại")}</label>
            <select
              id="finance-type"
              value={loai}
              onChange={(e) => onLoaiChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
            >
              <option value="chi">{tr("Chi tiêu")}</option>
              <option value="thu">{tr("Thu nhập")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="finance-category" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Danh mục")}</label>
            <CategorySelect allowArchived={editing} id="finance-category" loai={loai} value={danhMuc} onChange={onDanhMucChange} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>
          <div>
            <label htmlFor="finance-amount" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Số tiền (đồng)")}</label>
            <MoneyInput
              id="finance-amount"
              value={soTien}
              onValueChange={onSoTienChange}
              placeholder={tr("Ví dụ: 50 000")}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="finance-desc" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Mô tả (Không bắt buộc)")}</label>
          <input
            id="finance-desc"
            type="text"
            value={moTa}
            onChange={(e) => onMoTaChange(e.target.value)}
            placeholder={tr("Mua sách, tiền điện...")}
            maxLength={1000}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30"
          />
          {showEdge && (
            edgePrediction.label !== danhMuc ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-3 py-2 text-xs text-indigo-800 dark:border-indigo-800/70 dark:bg-indigo-950/40 dark:text-indigo-200">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
                  <span>{tr("EdgeAI (trên máy · {0}ms): gợi ý", edgePrediction.latencyMs)}</span>
                  <strong className="font-semibold">{edgeCategoryLabel}</strong>
                  <span>({pct}%)</span>
                  <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] text-indigo-600 dark:bg-slate-900/60 dark:text-indigo-300">
                    {edgePrediction.trainedSamples > 0
                      ? tr("Đã học {0} mẫu", edgePrediction.trainedSamples)
                      : tr("Offline")}
                  </span>
                </div>
                {onApplyEdgePrediction && (
                  <button
                    type="button"
                    onClick={onApplyEdgePrediction}
                    className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    {tr("Áp dụng")}
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{tr("EdgeAI khớp “{0}” · {1}% · {2}ms · offline", edgeCategoryLabel, pct, edgePrediction.latencyMs)}</span>
              </p>
            )
          )}
        </div>
        <div>
          <label htmlFor="finance-date" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{tr("Ngày giao dịch")}</label>
          <input
            id="finance-date"
            type="date"
            value={ngayGiaoDich}
            onChange={(e) => onNgayGiaoDichChange(e.target.value)}
            min="1000-01-01"
            max="9999-12-31"
            required
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500/30 transition-shadow"
          />

        </div>
        {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{tr(error)}</p>}
        <div className="grid grid-cols-2 gap-3 pt-2 sm:flex sm:justify-end">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-slate-200 dark:border-slate-600 px-5 py-2.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">{tr("Hủy")}</button>
          <button
            type="submit"
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            {dangLuu ? tr('Đang lưu…') : editing ? tr('Lưu thay đổi') : tr('Lưu')}
          </button>
        </div>
        </fieldset>
      </form>
    </div>
  );
}

export default TransactionForm;
