import { AlertTriangle, CheckCircle2, Circle, Clock, Edit2, Trash2 } from 'lucide-react';
import { badgeUuTien, textUuTien } from './deadlineUtils';
import { useEffect, useState } from 'react';
import { formatDeadlineDate, deadlineCountdown } from './deadlineDate';
import { completionCountdown } from './completionTime';
import { getDeadlineAlert } from '../dashboard/todayUtils';

const actionStyle = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-400 transition-colors disabled:opacity-50';

function DeadlineRow({ item, completed = false, onHoanThanh, onSua, onXoa, disabled, now, autoDelete }) {
  const countdownWarning = !completed && Boolean(getDeadlineAlert(item, now));
  if (completed) return <article className="flex min-w-0 items-start gap-2 py-3">
    <button type="button" disabled={disabled} onClick={()=>onHoanThanh(item.id,true)} aria-label={`Đánh dấu chưa hoàn thành: ${item.tieuDe}`} title="Hoàn tác" className={actionStyle+' shrink-0 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-700'}><CheckCircle2 className="h-5 w-5"/></button>
    <div className="min-w-0 flex-1 pt-2">
      <h3 className="break-words text-sm font-semibold text-slate-500 line-through dark:text-slate-400">{item.tieuDe}</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDeadlineDate(item.hanChot)}</p>
      {autoDelete&&<p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{completionCountdown(item,now)}</p>}
    </div>
    <button type="button" disabled={disabled} onClick={()=>onXoa(item)} title="Xóa" aria-label={`Xóa deadline: ${item.tieuDe}`} className={actionStyle+' shrink-0 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20'}><Trash2 className="h-4 w-4"/></button>
  </article>;
  return <article className={`grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-x-2 gap-y-1 rounded-xl border p-3 sm:flex sm:items-center sm:gap-3 ${completed
    ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50'
    : 'border-slate-200 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800'}`}>
    <button type="button" disabled={disabled} onClick={() => onHoanThanh(item.id, completed)}
      title={completed ? 'Hoàn tác' : 'Đánh dấu hoàn thành'}
      aria-label={`${completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}: ${item.tieuDe}`}
      className={actionStyle + ' shrink-0 hover:bg-emerald-50 dark:hover:bg-slate-700'}>
      {completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        : <Circle className="h-6 w-6 text-slate-300 hover:text-emerald-500 dark:text-slate-500" />}
    </button>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className={'min-w-0 break-words [overflow-wrap:anywhere] text-sm font-semibold ' + (completed ? 'text-slate-500 line-through dark:text-slate-400' : 'text-slate-900 dark:text-white')}>{item.tieuDe}</h3>

      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />{formatDeadlineDate(item.hanChot)}</p>
    </div>
    <div className="col-span-2 flex min-w-0 shrink-0 items-center justify-end gap-2 sm:ml-2">
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
        {completed && autoDelete && <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">{completionCountdown(item, now)}</span>}
        {!completed && <span className={`min-w-[5.5rem] shrink-0 rounded-full text-center px-2 py-0.5 text-[11px] font-semibold ${badgeUuTien(item.doUuTien)}`}>{textUuTien(item.doUuTien)}</span>}

      {!completed&&<span className={`min-w-[6.5rem] rounded-full px-2 py-0.5 text-center text-[11px] font-medium ${countdownWarning ? badgeUuTien('cao') : 'border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300'}`}>{deadlineCountdown(item.hanChot,now)}</span>}
      </div><div className="flex shrink-0">
      {!completed && <button type="button" disabled={disabled} onClick={() => onSua(item)} title="Sửa" aria-label={`Sửa deadline: ${item.tieuDe}`}
        className={actionStyle + ' hover:bg-slate-100 hover:text-ink-600 dark:hover:bg-slate-700 dark:hover:text-ink-300'}><Edit2 className="h-4 w-4" /></button>}
      <button type="button" disabled={disabled} onClick={() => onXoa(item)} title="Xóa" aria-label={`Xóa deadline: ${item.tieuDe}`}
        className={actionStyle + ' hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20'}><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  </article>;
}

export default function DeadlineListView({ dangDienHanh = [], daHoanThanh = [], onHoanThanh, onSua, onXoa, autoDelete = false, disabled = false, emptyMessage = 'Không còn công việc cần hoàn thành.' }) {
  const [now,setNow]=useState(Date.now);
  useEffect(()=>{const refresh=()=>setNow(Date.now());const timer=setInterval(refresh,60000);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};},[]);
  const actions = { onHoanThanh, onSua, onXoa, disabled, now, autoDelete };
  return <div className="space-y-6">
    <section aria-label="Công việc cần hoàn thành">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-slate-800 dark:text-slate-200"><AlertTriangle className="h-5 w-5 text-amber-500" />Cần hoàn thành ({dangDienHanh.length})</h2>
      {dangDienHanh.length ? <div className="grid gap-2">{dangDienHanh.map(item => <DeadlineRow key={item.id} item={item} {...actions} />)}</div>
        : <p className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-800">{emptyMessage}</p>}
    </section>
    <section aria-label="Công việc đã hoàn thành"><details className="rounded-xl border border-slate-200 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-800">
      <summary className="min-h-11 cursor-pointer py-2 text-base font-semibold text-slate-600 dark:text-slate-300">Đã hoàn thành ({daHoanThanh.length})</summary>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">{daHoanThanh.map(item => <DeadlineRow key={item.id} item={item} completed {...actions} />)}
        {!daHoanThanh.length && <p className="text-sm text-slate-500">Chưa có việc đã hoàn thành.</p>}
      </div>
    </details></section>
  </div>;
}
