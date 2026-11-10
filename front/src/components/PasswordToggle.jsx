import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordToggle({ visible, onClick, label = 'mật khẩu', disabled = false }) {
  useLanguage();
  const title = tr(visible ? 'Ẩn {0}' : 'Hiện {0}', tr(label));
  const Icon = visible ? EyeOff : Eye;
  return <button type="button" onClick={onClick} disabled={disabled} title={title} aria-label={title} aria-pressed={visible}
    className="absolute inset-y-0 right-0 flex min-h-11 w-11 items-center justify-center rounded-r-lg text-slate-700 hover:bg-slate-200/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-500 dark:text-slate-100 dark:hover:bg-slate-600 disabled:opacity-50">
    <Icon aria-hidden="true" strokeWidth={2.5} className="h-5 w-5 rounded bg-slate-100 p-0.5 dark:bg-slate-700" />
  </button>;
}
