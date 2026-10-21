import { useEffect, useState } from 'react';
import useDataRevision from '../../hooks/useDataRevision';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, RefreshCw, ArrowUpRight } from 'lucide-react';
import { timetableService } from '../../services/timetableService';
import { deadlineService } from '../../services/deadlineService';
import { dinhDangNgay } from '../../utils/formatters';
import { getTodayClasses, getUrgentDeadlines, localDayKey } from './todayUtils';

const cardStyle = 'flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5';
const linkStyle = 'inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink-600 hover:underline';

function LoadingOrError({ result, loading, children }) {
  if (loading) return <p role="status" className="py-3 text-sm text-slate-500">Đang tải…</p>;
  if (result?.status === 'rejected') return <p role="alert" className="py-3 text-sm text-rose-600 dark:text-rose-400">Chưa tải được mục này. Nhấn làm mới để thử lại.</p>;
  return children;
}

export default function DashboardToday({ userId, semester }) {
  const externalRevision = useDataRevision();
  const [busyId, setBusyId] = useState(null);
  const { hienToast } = useToast();
  const [now, setNow] = useState(() => new Date());
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const dayKey = localDayKey(now);
  const queryKey = `${userId}:${semester}:${dayKey}:${revision}:${externalRevision}`;
  const isLoading = (key) => data?.key !== queryKey || !data?.[key];
  const loading = ['classes', 'deadlines'].some(isLoading);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        setNow(new Date());
        setRevision((value) => value + 1);
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
      ['classes', () => timetableService.layThoiKhoaBieu(semester)],
      ['deadlines', () => deadlineService.layDanhSachDeadline(semester)],
    ];
    sources.forEach(async ([key, request]) => {
      let result;
      try { result = { status: 'fulfilled', value: await request() }; }
      catch { result = { status: 'rejected' }; }
      if (active) setData((previous) => ({ ...(previous?.key === queryKey ? previous : {}), key: queryKey, [key]: result }));
    });
    return () => { active = false; };
  }, [queryKey, semester]);

  async function complete(id) {
    if (busyId !== null) return;
    setBusyId(id);
    try { await deadlineService.hoanThanhDeadline(id); hienToast('success', 'Đã hoàn thành công việc!'); }
    catch (error) { hienToast('error', error.response?.data?.message || 'Chưa cập nhật được công việc.'); }
    finally { setBusyId(null); }
  }
  const classes = getTodayClasses(data?.classes?.value?.data?.thoiKhoaBieu || [], now);
  const deadlines = getUrgentDeadlines(data?.deadlines?.value?.data?.deadlines || [], now);

  return (
    <section aria-labelledby="today-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="today-heading" className="text-base font-semibold text-slate-900">Trong ngày</h2>
        <button type="button" disabled={loading} onClick={() => { setNow(new Date()); setRevision((value) => value + 1); }} aria-label="Làm mới lịch và công việc" title="Làm mới" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"><RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <article className={cardStyle}>
          <div className="mb-4 flex items-center gap-2 text-slate-800"><Clock aria-hidden="true" className="h-5 w-5 text-amber-600" /><h3 className="font-semibold">Việc cần làm</h3></div>
          <LoadingOrError result={data?.deadlines} loading={isLoading('deadlines')}>
            {deadlines.items.length ? <>
              <p className="mb-3 text-xs text-slate-500">{deadlines.overdue.length} quá hạn · {deadlines.dueToday.length} đến hạn hôm nay</p>
              <ul className="space-y-3">{deadlines.items.slice(0, 4).map((item) => {
                const late = new Date(item.hanChot) < now;
                const today = localDayKey(new Date(item.hanChot)) === dayKey;
                return <li key={item.id} className="rounded-xl bg-slate-50 p-3">
                  <Link to="/deadline" className="block break-words text-sm font-semibold text-slate-800 hover:text-ink-600">{item.tieuDe}</Link>
                  <p className={`mt-1 text-xs ${late ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>{late ? 'Quá hạn · ' : today ? 'Hôm nay · ' : ''}{dinhDangNgay(item.hanChot, true)}</p>
                  {item.checklist?.length > 0 && <p className="mt-1 text-xs text-slate-500">{item.checklist.filter((step) => step.done).length}/{item.checklist.length} bước đã xong</p>}
                  {item.monHoc?.ten && <p className="mt-1 break-words text-xs text-slate-500">{item.monHoc.ten}</p>}
                  <button type="button" onClick={() => complete(item.id)} disabled={busyId !== null} aria-label={`Hoàn thành: ${item.tieuDe}`} className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-emerald-700 disabled:opacity-50">{busyId === item.id ? 'Đang lưu…' : '✓ Hoàn thành'}</button>
                </li>;
              })}</ul>
              {deadlines.items.length > 4 && <p className="mt-3 text-xs text-slate-500">Còn {deadlines.items.length - 4} việc khác trong danh sách.</p>}
            </> : <div className="py-2 text-sm text-slate-500"><CheckCircle2 aria-hidden="true" className="mb-2 h-6 w-6 text-emerald-600" />Không có việc gấp.</div>}
          </LoadingOrError>
          <Link to="/deadline" className={`${linkStyle} mt-auto pt-4`}>Xem tất cả <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </article>

        <article className={cardStyle}>
          <div className="mb-4 flex items-center gap-2 text-slate-800"><CalendarDays aria-hidden="true" className="h-5 w-5 text-ink-600" /><h3 className="font-semibold">Lịch học hôm nay</h3></div>
          <LoadingOrError result={data?.classes} loading={isLoading('classes')}>
            {classes.length ? <ul className="space-y-3">{classes.map((item) => (
              <li key={item.id} className={`rounded-xl p-3 ${item.status === 'ongoing' ? 'bg-ink-50 ring-1 ring-ink-200 dark:bg-ink-500/10' : 'bg-slate-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-semibold text-slate-600">{item.gioBatDau}–{item.gioKetThuc}</span><span className="text-ink-600">{item.status === 'ongoing' ? 'Đang học' : item.status === 'done' ? 'Đã kết thúc' : 'Sắp học'}</span></div>
                <p className="mt-1 break-words text-sm font-semibold text-slate-800">{item.tenMon}</p>
                {(item.phongHoc || item.giangVien) && <p className="mt-1 break-words text-xs text-slate-500">{[item.phongHoc && `Phòng ${item.phongHoc}`, item.giangVien].filter(Boolean).join(' · ')}</p>}
              </li>
            ))}</ul> : <p className="py-2 text-sm text-slate-500">Hôm nay chưa có lịch.</p>}
          </LoadingOrError>
          <Link to="/thoi-khoa-bieu" className={`${linkStyle} mt-auto pt-4`}>Xem lịch tuần <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </article>

      </div>
    </section>
  );
}
