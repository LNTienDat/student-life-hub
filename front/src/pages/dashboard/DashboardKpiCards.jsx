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
      cardBorder: 'border-blue-200 dark:border-blue-800/60 hover:border-blue-400 dark:hover:border-blue-500',
      cardGlow: 'hover:shadow-blue-500/15',
      topBar: 'bg-gradient-to-r from-blue-600 to-indigo-500',
      iconBox: 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300 ring-4 ring-blue-500/10',
      valueColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      to: '/deadline',
      title: 'Deadline trong 7 ngày',
      value: deadlineUnavailable ? '—' : deadlinesSapToi.length,
      unit: 'việc',
      hint: 'Chưa hoàn thành',
      Icon: CalendarDays,
      cardBorder: 'border-violet-200 dark:border-violet-800/60 hover:border-violet-400 dark:hover:border-violet-500',
      cardGlow: 'hover:shadow-violet-500/15',
      topBar: 'bg-gradient-to-r from-violet-600 to-purple-500',
      iconBox: 'bg-violet-100 text-violet-600 dark:bg-violet-900/60 dark:text-violet-300 ring-4 ring-violet-500/10',
      valueColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      to: '/tai-chinh',
      title: 'Số dư tháng này',
      value: thongKeTaiChinh ? dinhDangTien(thongKeTaiChinh.soDu) : '—',
      hint: 'Thu − chi',
      Icon: Wallet,
      cardBorder: 'border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-500',
      cardGlow: 'hover:shadow-emerald-500/15',
      topBar: 'bg-gradient-to-r from-emerald-600 to-teal-500',
      iconBox: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300 ring-4 ring-emerald-500/10',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];
  return <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
    {cards.map(({ to, title, value, unit, hint, Icon, cardBorder, cardGlow, topBar, iconBox, valueColor }) => (
      <Link
        key={to}
        to={to}
        className={`group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:bg-slate-800/95 sm:p-5 ${cardBorder} ${cardGlow}`}
      >
        <div className={`absolute inset-x-0 top-0 h-1.5 ${topBar}`} />
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{tr(title)}</span>
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${iconBox}`}>
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
          </span>
        </div>
        <p className={`mt-3 break-words font-display text-2xl font-bold tabular-nums sm:text-3xl ${valueColor}`}>
          {value} <span className="font-sans text-sm font-normal text-slate-500 dark:text-slate-400">{tr(unit)}</span>
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{tr(hint)}</p>
      </Link>
    ))}
  </div>;
}
