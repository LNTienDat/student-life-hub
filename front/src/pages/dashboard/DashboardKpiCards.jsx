import { Link } from 'react-router-dom';
import { GraduationCap, CalendarDays, Wallet } from 'lucide-react';
import { dinhDangTien } from '../../utils/formatters';

export default function DashboardKpiCards({ gpa, deadlinesSapToi = [], thongKeTaiChinh, deadlineUnavailable, semester }) {
  const cards = [
    { to: '/mon-hoc', title: `GPA ${semester ? 'học kỳ' : 'tích lũy'}`, value: gpa == null ? '—' : Number(gpa).toFixed(2), unit: '/ 10', hint: gpa == null ? 'Chưa có điểm' : 'Tạm tính từ điểm đã nhập', Icon: GraduationCap },
    { to: '/deadline', title: 'Deadline trong 7 ngày', value: deadlineUnavailable ? '—' : deadlinesSapToi.length, unit: 'việc', hint: 'Chưa hoàn thành', Icon: CalendarDays },
    { to: '/tai-chinh', title: 'Số dư tháng này', value: thongKeTaiChinh ? dinhDangTien(thongKeTaiChinh.soDu) : '—', hint: 'Thu − chi', Icon: Wallet },
  ];
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    {cards.map(({ to, title, value, unit, hint, Icon }) => <Link key={to} to={to} className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-ink-300 sm:block sm:p-5">
      <div className="flex items-center justify-between gap-2 text-slate-500"><span className="text-sm font-medium">{title}</span><Icon aria-hidden="true" className="hidden h-4 w-4 shrink-0 sm:block" /></div>
      <p className="break-words text-right font-display text-lg font-bold tabular-nums text-slate-900 sm:mt-3 sm:text-left sm:text-2xl">{value} <span className="font-sans text-sm font-normal text-slate-500">{unit}</span></p>
      <p className="mt-2 hidden text-xs text-slate-500 sm:block">{hint}</p>
    </Link>)}
  </div>;
}
