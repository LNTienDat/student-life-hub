import { useEffect, useState } from 'react';
import useDataRevision from '../../hooks/useDataRevision';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, RefreshCw, Wallet, ArrowUpRight } from 'lucide-react';
import { timetableService } from '../../services/timetableService';
import { deadlineService } from '../../services/deadlineService';
import { financeService } from '../../services/financeService';
import { dinhDangTien, dinhDangNgay } from '../../utils/formatters';
import { getTodayClasses, getUrgentDeadlines, getDailyBudget, localDayKey } from './todayUtils';

const cardStyle = 'rounded-2xl border border-slate-100 bg-white p-5 shadow-sm';
const linkStyle = 'inline-flex items-center gap-1 text-xs font-semibold text-ink-600 hover:underline';

function LoadingOrError({ result, loading, children }) {
  if (loading) return <p role="status" className="py-3 text-sm text-slate-500">Đang tải…</p>;
  if (result?.status === 'rejected') return <p role="alert" className="py-3 text-sm text-rose-600 dark:text-rose-400">Chưa tải được mục này. Nhấn làm mới để thử lại.</p>;
  return children;
}

export default function DashboardToday({ userId, semester, onQuickEntry }) {
  const externalRevision = useDataRevision();
  const [busyId, setBusyId] = useState(null);
  const { hienToast } = useToast();
  const [now, setNow] = useState(() => new Date());
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const dayKey = localDayKey(now);
  const queryKey = `${userId}:${semester}:${dayKey}:${revision}:${externalRevision}`;
  const isLoading = (key) => data?.key !== queryKey || !data?.[key];
  const loading = ['classes', 'deadlines', 'budgets'].some(isLoading);

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
      ['budgets', () => financeService.layNganSach()],
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
  const budget = getDailyBudget(data?.budgets?.value?.data?.ketQua || [], now);
  const nextClass = classes.find((item) => item.status !== 'done');

  return (
    <section aria-labelledby="today-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="today-heading" className="font-display text-xl font-bold text-slate-900">Hôm nay của bạn</h2>
          <p className="mt-1 text-sm text-slate-500">{now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button type="button" disabled={loading} onClick={() => { setNow(new Date()); setRevision((value) => value + 1); }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Làm mới
        </button>
      </div>

      {!isLoading('deadlines') && data?.deadlines?.status === 'fulfilled' && (
        <div className="rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-700 dark:bg-ink-500/10 dark:text-ink-200">
          {deadlines.overdue.length ? `Bạn còn ${deadlines.overdue.length} việc quá hạn. Hãy kiểm tra và cập nhật trước.`
            : deadlines.dueToday.length ? `Có ${deadlines.dueToday.length} việc đến hạn hôm nay. Dành thời gian hoàn thành nhé!`
              : !isLoading('classes') && nextClass ? `Buổi học ${nextClass.status === 'ongoing' ? 'đang diễn ra' : 'tiếp theo'}: ${nextClass.tenMon}, ${nextClass.gioBatDau}–${nextClass.gioKetThuc}.`
                : 'Không có việc đến hạn hôm nay. Bạn có thể chuẩn bị bài cho những ngày tới.'}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className={cardStyle}>
          <div className="mb-4 flex items-center gap-2 text-slate-800"><CalendarDays aria-hidden="true" className="h-5 w-5 text-ink-600" /><h3 className="font-semibold">Lịch học hôm nay</h3></div>
          <LoadingOrError result={data?.classes} loading={isLoading('classes')}>
            {classes.length ? <ul className="space-y-3">{classes.map((item) => (
              <li key={item.id} className={`rounded-xl p-3 ${item.status === 'ongoing' ? 'bg-ink-50 ring-1 ring-ink-200 dark:bg-ink-500/10' : 'bg-slate-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-semibold text-slate-600">{item.gioBatDau}–{item.gioKetThuc}</span><span className="text-ink-600">{item.status === 'ongoing' ? 'Đang học' : item.status === 'done' ? 'Đã kết thúc' : 'Sắp học'}</span></div>
                <p className="mt-1 break-words text-sm font-semibold text-slate-800">{item.tenMon}</p>
                {(item.phongHoc || item.giangVien) && <p className="mt-1 break-words text-xs text-slate-500">{[item.phongHoc && `Phòng ${item.phongHoc}`, item.giangVien].filter(Boolean).join(' · ')}</p>}
              </li>
            ))}</ul> : <p className="py-2 text-sm text-slate-500">Hôm nay chưa có lịch học. Thêm lịch để theo dõi buổi học tiếp theo.</p>}
          </LoadingOrError>
          <button type="button" onClick={() => onQuickEntry('class')} className={`${linkStyle} mt-3 mr-4`}>+ Thêm lịch</button>
          <Link to="/thoi-khoa-bieu" className={`${linkStyle} mt-4`}>Xem thời khóa biểu <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </article>

        <article className={cardStyle}>
          <div className="mb-4 flex items-center gap-2 text-slate-800"><Clock aria-hidden="true" className="h-5 w-5 text-amber-600" /><h3 className="font-semibold">Việc cần ưu tiên</h3></div>
          <LoadingOrError result={data?.deadlines} loading={isLoading('deadlines')}>
            {deadlines.items.length ? <>
              <p className="mb-3 text-xs text-slate-500">{deadlines.overdue.length} quá hạn · {deadlines.dueToday.length} đến hạn hôm nay</p>
              <ul className="space-y-3">{deadlines.items.slice(0, 4).map((item) => {
                const late = new Date(item.hanChot) < now;
                const today = localDayKey(new Date(item.hanChot)) === dayKey;
                return <li key={item.id} className="rounded-xl bg-slate-50 p-3">
                  <button type="button" onClick={() => complete(item.id)} disabled={busyId !== null} aria-label={`Hoàn thành: ${item.tieuDe}`} className="mb-2 block text-xs font-semibold text-emerald-600 disabled:opacity-50">{busyId === item.id ? 'Đang lưu…' : '✓ Hoàn thành'}</button>
                  <Link to="/deadline" className="break-words text-sm font-semibold text-slate-800 hover:text-ink-600">{item.tieuDe}</Link>
                  <p className={`mt-1 text-xs ${late ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>{late ? 'Quá hạn · ' : today ? 'Hôm nay · ' : ''}{dinhDangNgay(item.hanChot, true)}</p>
                  {item.checklist?.length > 0 && <p className="mt-1 text-xs text-slate-500">{item.checklist.filter((step) => step.done).length}/{item.checklist.length} bước đã xong</p>}
                  {item.monHoc?.ten && <p className="mt-1 break-words text-xs text-slate-500">{item.monHoc.ten}</p>}
                </li>;
              })}</ul>
              {deadlines.items.length > 4 && <p className="mt-3 text-xs text-slate-500">Còn {deadlines.items.length - 4} việc khác trong danh sách.</p>}
            </> : <div className="py-2 text-sm text-slate-500"><CheckCircle2 aria-hidden="true" className="mb-2 h-6 w-6 text-emerald-600" />Không có việc quá hạn hoặc đến hạn trong 7 ngày tới.</div>}
          </LoadingOrError>
          <button type="button" onClick={() => onQuickEntry('deadline')} className={`${linkStyle} mt-3 mr-4`}>+ Thêm việc</button>
          <Link to="/deadline" className={`${linkStyle} mt-4`}>Quản lý deadline <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </article>

        <article className={cardStyle}>
          <div className="mb-4 flex items-center gap-2 text-slate-800"><Wallet aria-hidden="true" className="h-5 w-5 text-emerald-600" /><h3 className="font-semibold">Nhịp chi tiêu</h3></div>
          <LoadingOrError result={data?.budgets} loading={isLoading('budgets')}>
            {budget ? <>
              <p className="text-xs text-slate-500">Bình quân mỗi ngày còn lại trong tháng</p>
              <p className="mt-2 break-words font-display text-3xl font-bold text-slate-900">{dinhDangTien(budget.perDay)}</p>
              <p className="mt-3 text-sm text-slate-600">Còn {dinhDangTien(budget.remaining)} trong các danh mục chưa vượt ngân sách, chia cho {budget.daysLeft} ngày (gồm hôm nay).</p>
              {budget.exceeded > 0 && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{budget.exceeded} danh mục đã vượt ngân sách. Kiểm tra trước khi chi thêm.</p>}
              <p className="mt-3 text-xs leading-relaxed text-slate-500">Gợi ý dựa trên ngân sách theo danh mục bạn đã đặt, không phải số tiền đang có. Chưa tính các danh mục chưa đặt ngân sách.</p>
            </> : <p className="py-2 text-sm text-slate-500">Đặt ngân sách tháng để biết mức chi bình quân cho những ngày còn lại.</p>}
          </LoadingOrError>
          <button type="button" onClick={() => onQuickEntry('expense')} className={`${linkStyle} mt-3 mr-4`}>+ Ghi khoản chi</button>
          <Link to="/tai-chinh" className={`${linkStyle} mt-4`}>Mở sổ chi tiêu <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
        </article>
      </div>
    </section>
  );
}
