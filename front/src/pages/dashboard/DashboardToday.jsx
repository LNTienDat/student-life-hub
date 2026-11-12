import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import {monday} from '../thoikhoabieu/weekUtils';
import { useEffect, useState } from 'react';
import useDataRevision from '../../hooks/useDataRevision';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, RefreshCw, ArrowUpRight } from 'lucide-react';
import { timetableService } from '../../services/timetableService';
import { deadlineService } from '../../services/deadlineService';
import { formatDeadlineDate } from '../deadline/deadlineDate';
import { getTodayClasses, getUrgentDeadlines, getDeadlineAlert, localDayKey } from './todayUtils';

const cardStyle = 'flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5';
const linkStyle = 'inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink-600 hover:underline';

function LoadingOrError({ result, loading, children }) {
  useLanguage();
  if (loading) return <p role="status" className="py-3 text-sm text-slate-500">{tr("Đang tải…")}</p>;
  if (result?.status === 'rejected') return <p role="alert" className="py-3 text-sm text-rose-600 dark:text-rose-400">{tr("Chưa tải được mục này. Nhấn làm mới để thử lại.")}</p>;
  return children;
}

export default function DashboardToday({ userId, semester }) {
  useLanguage();
  const externalRevision = useDataRevision();
  const [now, setNow] = useState(() => new Date());
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const dayKey = localDayKey(now);
  const queryKey = `${userId}:${semester}:${dayKey}:${revision}:${externalRevision}`;
  const isLoading = (key) => data?.key !== queryKey || !data?.[key];
  const loading = ['classes', 'deadlines'].some(isLoading);

  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') setNow(new Date()); }, 60_000);
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        setNow(new Date());
      }
    };
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const sources = [
      ['classes', () => timetableService.layThoiKhoaBieu(semester,monday())],
      ['deadlines', () => deadlineService.layDanhSachDeadline()],
    ];
    sources.forEach(async ([key, request]) => {
      let result;
      try { result = { status: 'fulfilled', value: await request() }; }
      catch { result = { status: 'rejected' }; }
      if (active) setData((previous) => ({ ...(previous?.key === queryKey ? previous : {}), key: queryKey, [key]: result }));
    });
    return () => { active = false; };
  }, [queryKey, semester]);

  const classes = getTodayClasses(data?.classes?.value?.data?.thoiKhoaBieu || [], now);
  const deadlines = getUrgentDeadlines(data?.deadlines?.value?.data?.deadlines || [], now);

  return (
    <section aria-labelledby="today-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="today-heading" className="text-base font-semibold text-slate-900">{tr("Trong ngày")}</h2>
        <button type="button" disabled={loading} onClick={() => { setNow(new Date()); setRevision((value) => value + 1); }} aria-label={tr("Làm mới lịch và công việc")} title={tr("Làm mới")} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"><RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-700/80 dark:border-l-amber-500 dark:bg-slate-800/95">
          <div className="mb-2 flex items-center justify-between gap-2 text-slate-800 dark:text-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
                <Clock aria-hidden="true" className="h-4 w-4" />
              </span>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">{tr("Deadline cần chú ý")}</h3>
            </div>
            <Link to="/deadline" aria-label={tr("Mở mục Deadline")} title={tr("Mở mục Deadline")} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-violet-600 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-slate-700 transition-colors">
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <LoadingOrError result={data?.deadlines} loading={isLoading('deadlines')}>
            {deadlines.items.length ? <>
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{deadlines.overdue.length}{tr(" quá hạn · ")}{deadlines.dueToday.length}{tr(" đến hạn hôm nay")}</p>
              <ul className="space-y-3">{deadlines.items.slice(0, 4).map((item) => {
                const late = new Date(item.hanChot) < now;
                const today = localDayKey(new Date(item.hanChot)) === dayKey;
                const alert = getDeadlineAlert(item, now);
                return <li key={item.id} className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3">
                  <div className="min-w-0 flex-1">
                    <Link to="/deadline" className="block break-words text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-300">{item.tieuDe}</Link>
                    <p className={`mt-1 text-xs ${late ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>{late ? tr('Quá hạn · ') : today ? tr('Hôm nay · ') : ''}{formatDeadlineDate(item.hanChot)}</p>
                  </div>
                  {alert && <span role="img" aria-label={tr("Cảnh báo: {0}", alert.label)} title={alert.label} className="deadline-alert mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[13px] font-bold leading-none"><span aria-hidden="true">!</span></span>}
                </li>;
              })}</ul>
              {deadlines.items.length > 4 && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{tr("Còn ")}{deadlines.items.length - 4}{tr(" việc khác trong danh sách.")}</p>}
            </> : <div className="flex items-center gap-2 py-2 text-sm text-slate-500 dark:text-slate-400"><CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-500" />{tr("Không có việc gấp.")}</div>}
          </LoadingOrError>
        </article>

        <article className="flex min-w-0 flex-col rounded-2xl border border-slate-200 border-l-4 border-l-sky-500 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-700/80 dark:border-l-sky-500 dark:bg-slate-800/95">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950/80 dark:text-sky-400">
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
              </span>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">{tr("Lịch học hôm nay")}</h3>
            </div>
            <Link to="/lich-hoc" aria-label={tr("Mở Lịch học")} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sky-600 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-slate-700 transition-colors">
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <LoadingOrError result={data?.classes} loading={isLoading('classes')}>
            {classes.length ? <ul className="space-y-3">{classes.map((item) => (
              <li key={item.occurrenceId||item.id} className={`rounded-xl p-3 ${item.status === 'ongoing' ? 'bg-sky-50 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:ring-sky-800' : 'bg-slate-50 dark:bg-slate-900/60'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-semibold text-slate-600 dark:text-slate-300">{item.gioBatDau}{tr("–")}{item.gioKetThuc}</span><span className="text-sky-600 dark:text-sky-400 font-medium">{item.status === 'ongoing' ? tr('Đang học') : item.status === 'done' ? tr('Đã kết thúc') : tr('Sắp học')}</span></div>
                <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{item.tenMon}</p>
                {(item.phongHoc || item.giangVien) && <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">{[item.phongHoc && `Phòng ${item.phongHoc}`, item.giangVien].filter(Boolean).join(' · ')}</p>}
              </li>
            ))}</ul> : <p className="py-2 text-sm text-slate-500 dark:text-slate-400">{tr("Hôm nay chưa có lịch.")}</p>}
          </LoadingOrError>
          <Link to="/lich-hoc" className="mt-auto inline-flex min-h-11 items-center gap-1 pt-4 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline">{tr("Xem lịch tuần ")}<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </article>

      </div>
    </section>
  );
}
