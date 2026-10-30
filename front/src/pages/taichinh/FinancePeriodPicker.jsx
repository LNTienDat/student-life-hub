import { ChevronLeft, ChevronRight } from 'lucide-react';
import { localDateInput, shiftFinancePeriod } from './financeUtils';
export default function FinancePeriodPicker({ value, onChange, disabled = false }) {
  const current = localDateInput().slice(0, 7);
  const previous = shiftFinancePeriod(value, -1), next = shiftFinancePeriod(value, 1);
  const style = 'min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
  return <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Chọn kỳ tài chính">
    <button type="button" className={style} aria-label="Tháng trước" disabled={disabled || !previous} onClick={() => onChange(previous)}><ChevronLeft size={18} /></button>
    <label className="sr-only" htmlFor="finance-period">Tháng/năm tài chính</label>
    <input id="finance-period" type="month" min="1000-01" max="9999-12" required value={value} disabled={disabled} onChange={e => onChange(e.target.value)} className={style + ' max-w-[190px] min-w-0'} />
    <button type="button" className={style} aria-label="Tháng sau" disabled={disabled || !next} onClick={() => onChange(next)}><ChevronRight size={18} /></button>
    {value !== current && <button type="button" className={style} disabled={disabled} onClick={() => onChange(current)}>Tháng hiện tại</button>}
  </div>;
}
