import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import { Link } from 'react-router-dom';
import { GraduationCap, CalendarDays, Wallet } from 'lucide-react';
import { dinhDangTien } from '../../utils/formatters';

export default function DashboardKpiCards({ gpa, gpaHe4, deadlinesSapToi = [], thongKeTaiChinh, deadlineUnavailable, semester }) {
  useLanguage();
  const gpaHint = gpa == null
    ? 'Chưa có điểm'
    : gpaHe4 != null
      ? `Thang 4: ${Number(gpaHe4).toFixed(2)}`
      : 'Tạm tính từ điểm đã nhập';
  const cards = [
    {
      to: '/mon-hoc',
      title: `GPA ${semester ? 'học kỳ' : 'tích lũy'}`,
      value: gpa == null ? '—' : Number(gpa).toFixed(2),
      unit: '/ 10',
      hint: gpaHint,
      Icon: GraduationCap,
      colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300',
      borderHover: 'hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-blue-500/10',
      accentGlow: 'from-blue-500/10 to-transparent',
    },
    {
      to: '/deadline',
      title: 'Deadline trong 7 ngày',
      value: deadlineUnavailable ? '—' : deadlinesSapToi.length,
      unit: 'việc',
      hint: 'Chưa hoàn thành',
      Icon: CalendarDays,
      colorClass: 'text-violet-600 bg-violet-50 dark:bg-violet-950/60 dark:text-violet-300',
      borderHover: 'hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-violet-500/10',
      accentGlow: 'from-violet-500/10 to-transparent',
    },
    {
      to: '/tai-chinh',
      title: 'Số dư tháng này',
      value: thongKeTaiChinh ? dinhDangTien(thongKeTaiChinh.soDu) : '—',
      hint: 'Thu − chi',
      Icon: Wallet,
      colorClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300',
      borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-emerald-500/10',
      accentGlow: 'from-emerald-500/10 to-transparent',
    },
  ];
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    {cards.map(({ to, title, value, unit, hint, Icon, colorClass, borderHover }) => (
      <Link
        key={to}
        to={to}
        className={`group relative flex min-w-0 items-center justify-between gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-all duration-200 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:block sm:p-5 ${borderHover}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{tr(title)}</span>
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${colorClass}`}>
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
          </span>
        </div>
        <p className="break-words text-right font-display text-lg font-bold tabular-nums text-slate-900 dark:text-white sm:mt-3 sm:text-left sm:text-2xl">
          {value} <span className="font-sans text-sm font-normal text-slate-500 dark:text-slate-400">{tr(unit)}</span>
        </p>
        <p className="mt-2 hidden text-xs text-slate-500 dark:text-slate-400 sm:block">{tr(hint)}</p>
      </Link>
    ))}
  </div>;
}
