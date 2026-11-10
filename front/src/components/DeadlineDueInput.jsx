import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import { useState } from 'react';

const inputStyle = 'min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ink-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white';
export default function DeadlineDueInput({value,onValueChange,id='deadline-due',name,disabled,compact=false}) {
  useLanguage();
  const [withTime,setWithTime]=useState(value.includes('T'));
  const [lastTime,setLastTime]=useState(value.split('T')[1]||'09:00');
  const day=value.split('T')[0],time=value.split('T')[1]||lastTime;
  const dateField=<input id={id} type="date" required disabled={disabled} value={day} onChange={event=>onValueChange(event.target.value+(withTime?'T'+time:''))} className={inputStyle}/>;
  const toggle=<label className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={withTime} disabled={disabled} onChange={event=>{setWithTime(event.target.checked);onValueChange(day+(event.target.checked?'T'+lastTime:''));}} aria-controls={id+'-time-field'}/>{tr("Thêm giờ")}</label>;
  const timeField=<input id={id+'-time'} type="time" required disabled={disabled} value={time} onChange={event=>{setLastTime(event.target.value);onValueChange(day+'T'+event.target.value);}} className={inputStyle}/>;
  const hidden=name&&<input type="hidden" name={name} value={value} disabled={disabled}/>;
  if(compact)return <div className="min-w-0">
    <div className="flex min-h-11 items-center justify-between gap-2"><label htmlFor={id} className="text-sm text-slate-600 dark:text-slate-300">{tr("Ngày hạn chót")}</label>{toggle}</div>
    <div className="flex flex-wrap items-start gap-2 pt-1"><div className="min-w-0 basis-40 flex-1">{dateField}</div>{withTime&&<div id={id+'-time-field'} className="min-w-0 basis-28 flex-1"><label htmlFor={id+'-time'} className="sr-only">{tr("Giờ hạn chót")}</label>{timeField}</div>}</div>
    {hidden}
  </div>;
  return <div className="min-w-0 space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-400">{tr("Ngày hạn chót")}</label>{dateField}{toggle}
    {withTime&&<div id={id+'-time-field'} className="space-y-1"><label htmlFor={id+'-time'} className="text-sm text-slate-600 dark:text-slate-400">{tr("Giờ hạn chót")}</label>{timeField}</div>}
    {hidden}
  </div>;
}
