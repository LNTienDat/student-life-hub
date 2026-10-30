import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, doiTheme } = useTheme();
  const label = theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
  return <button type="button" onClick={doiTheme} title={label} aria-label={label}
    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
    {theme === 'dark' ? <Sun aria-hidden="true" className="h-5 w-5" /> : <Moon aria-hidden="true" className="h-5 w-5" />}
  </button>;
}
