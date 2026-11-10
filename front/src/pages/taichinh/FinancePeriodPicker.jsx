import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId } from 'react';
import { localDateInput, shiftFinancePeriod } from './financeUtils';
export default function FinancePeriodPicker({ value, onChange, disabled = false, fieldLabel = 'Tháng/năm tài chính', groupLabel = 'Chọn kỳ tài chính' }) {
  useLanguage();
  const inputId = useId();
  const current = localDateInput().slice(0, 7);
  const previous = shiftFinancePeriod(value, -1), next = shiftFinancePeriod(value, 1);
  const style = 'min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
  return <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 sm:flex sm:flex-wrap" role="group" aria-label={tr(groupLabel)}>
    <button type="button" className={style} aria-label={tr("Tháng trước")} disabled={disabled || !previous} onClick={() => onChange(previous)}><ChevronLeft size={18} /></button>
    <label className="sr-only" htmlFor={inputId}>{tr(fieldLabel)}</label>
    <input id={inputId} type="month" min="1000-01" max="9999-12" required value={value} disabled={disabled} onChange={e => onChange(e.target.value)} className={style + ' w-full min-w-0 sm:w-56'} />
    <button type="button" className={style} aria-label={tr("Tháng sau")} disabled={disabled || !next} onClick={() => onChange(next)}><ChevronRight size={18} /></button>
    {value !== current && <button type="button" className={style + ' col-span-3'} disabled={disabled} onClick={() => onChange(current)}>{tr("Tháng hiện tại")}</button>}
  </div>;
}
