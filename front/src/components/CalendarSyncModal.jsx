import { useState } from 'react';
import { CalendarPlus, Check, Download, ExternalLink } from 'lucide-react';
import ModalDialog from './ModalDialog';
import useLanguage from '../hooks/useLanguage';
import { t as tr } from '../i18n/language';
import { GOOGLE_CALENDAR_IMPORT_URL } from '../utils/icsExport';

export default function CalendarSyncModal({
  open,
  onClose,
  title,
  subtitle,
  items = [],
  onDownloadIcs,
}) {
  useLanguage();
  const [downloaded, setDownloaded] = useState(false);

  function handleDownload() {
    onDownloadIcs?.();
    setDownloaded(true);
  }

  return (
    <ModalDialog open={open} onClose={onClose} title={title} wide>
      <div className="space-y-4 text-sm">
        {subtitle && <p className="text-slate-600 dark:text-slate-300">{tr(subtitle)}</p>}

        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-200">
          {tr("Mẹo tránh phải đăng nhập Outlook trên Windows: không nhấp đúp file .ics trong máy. Hãy bấm thêm trực tiếp vào Google Calendar Web hoặc mở trang Nhập Google Calendar bên dưới.")}
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {tr("Mở nhanh từng mục trên Google Calendar Web")}
            </h3>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
                    {item.meta && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.meta}</p>}
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700 whitespace-nowrap"
                  >
                    <CalendarPlus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {tr("Thêm vào Google Calendar")}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-700 dark:bg-slate-900/40 space-y-3">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">
              {tr("Hoặc nhập toàn bộ bằng file .ics (2 bước)")}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {tr("Bước 1 tải file .ics về máy, Bước 2 mở trang Nhập của Google Calendar trên trình duyệt rồi kéo file vừa tải vào.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              {downloaded ? <Check className="h-4 w-4 text-emerald-600 shrink-0" /> : <Download className="h-4 w-4 shrink-0" />}
              {downloaded ? tr("Đã tải file .ics") : tr("1. Tải file .ics")}
            </button>
            <a
              href={GOOGLE_CALENDAR_IMPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap"
            >
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              {tr("2. Mở trang Nhập Google Calendar")}
            </a>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}
