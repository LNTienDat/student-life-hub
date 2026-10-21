import { useState } from 'react';

const inputStyle = 'mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white';
export default function DeadlineDueInput({ value, onValueChange, id = 'deadline-due', name, disabled }) {
  const [withTime, setWithTime] = useState(value.includes('T'));
  const [lastTime, setLastTime] = useState(value.split('T')[1] || '09:00');
  const day = value.split('T')[0];
  const time = value.split('T')[1] || lastTime;
  return <div className="min-w-0 space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-400">Ngày hạn chót</label>
    <input id={id} type="date" required disabled={disabled} value={day} onChange={event => onValueChange(event.target.value + (withTime ? `T${time}` : ''))} className={inputStyle} />
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={withTime} disabled={disabled} onChange={event => { setWithTime(event.target.checked); onValueChange(day + (event.target.checked ? `T${lastTime}` : '')); }} aria-controls={`${id}-time-field`} />Thêm giờ</label>
    {withTime && <div id={`${id}-time-field`}><label htmlFor={`${id}-time`} className="text-sm text-slate-600 dark:text-slate-400">Giờ hạn chót</label><input id={`${id}-time`} type="time" required disabled={disabled} value={time} onChange={event => { setLastTime(event.target.value); onValueChange(`${day}T${event.target.value}`); }} className={inputStyle} /></div>}
    {name && <input type="hidden" name={name} value={value} disabled={disabled} />}
  </div>;
}
