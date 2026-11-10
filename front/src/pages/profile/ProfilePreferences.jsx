import { useSyncExternalStore } from 'react';
import { CheckCircle2 } from 'lucide-react';
import InstallButton from '../../components/InstallButton';
import useLanguage from '../../hooks/useLanguage';
import { t as tr } from '../../i18n/language';
import pwaClient from '../../pwa/runtime';

export default function ProfilePreferences() {
  const { language, setLanguage } = useLanguage();
  const { installed } = useSyncExternalStore(pwaClient.subscribe, pwaClient.getSnapshot);

  return <>
    <div role="group" aria-label={tr('Ngôn ngữ giao diện')} className="inline-flex max-w-full items-center rounded-xl border border-slate-200 p-0.5 dark:border-slate-600">
      {[['vi', 'Tiếng Việt'], ['en', 'English']].map(([value, name]) => (
        <button type="button" key={value} lang={value} aria-pressed={language === value} onClick={() => setLanguage(value)} className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${language === value ? 'bg-ink-600 text-white' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700'}`}>{name}</button>
      ))}
    </div>
    {installed ? (
      <span className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 aria-hidden="true" className="h-4 w-4" />{tr('Đã cài ứng dụng')}</span>
    ) : (
      <InstallButton className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-ink-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-ink-200 dark:hover:bg-slate-700">{tr('Cài LifeHub')}</InstallButton>
    )}
  </>;
}
