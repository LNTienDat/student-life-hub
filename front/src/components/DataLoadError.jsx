import { t as tr } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
export default function DataLoadError({ message, onRetry }) {
  useLanguage();
  return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
    <p>{tr(message)}</p>
    <button type="button" onClick={onRetry} className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-rose-200 bg-white px-4 font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:bg-slate-800 dark:text-rose-200 dark:hover:bg-rose-950">{tr("Thử tải lại")}</button>
  </div>;
}
