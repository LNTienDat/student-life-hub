import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import { X } from 'lucide-react';

export default function CloseButton({ onClick, disabled = false, label = 'Đóng', className = '', ...props }) {
  useLanguage();
  return <button {...props} type="button" onClick={onClick} disabled={disabled} aria-label={tr(label)} title={tr(label)}
    className={'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white ' + className}>
    <X aria-hidden="true" className="h-5 w-5"/>
  </button>;
}
