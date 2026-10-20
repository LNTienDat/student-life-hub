import { Link } from 'react-router-dom';
import { GraduationCap, CalendarDays, Wallet, ArrowUpRight } from 'lucide-react';
import { dinhDangTien } from '../../utils/formatters';

export default function DashboardKpiCards({ gpa, deadlinesSapToi = [], thongKeTaiChinh, deadlineUnavailable, semester }) {
  const cards = [
    { to: '/mon-hoc', title: `GPA ${semester ? 'học kỳ' : 'tích lũy'}`, value: gpa == null ? '—' : Number(gpa).toFixed(2), unit: '/ 10', hint: 'Tạm tính từ các điểm đã nhập', Icon: GraduationCap },
    { to: '/deadline', title: 'Deadline trong 7 ngày', value: deadlineUnavailable ? '—' : deadlinesSapToi.length, unit: 'việc', hint: 'Xem danh sách công việc', Icon: CalendarDays },
    { to: '/tai-chinh', title: 'Số dư tháng này', value: thongKeTaiChinh ? dinhDangTien(thongKeTaiChinh.soDu) : '—', hint: 'Tổng thu trừ tổng chi trong tháng', Icon: Wallet },
  ];
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    {cards.map(({ to, title, value, unit, hint, Icon }) => <Link key={to} to={to} className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-ink-300 sm:p-5">
      <div className="flex items-center justify-between gap-2 text-slate-500"><span className="text-sm font-medium">{title}</span><Icon aria-hidden="true" className="h-4 w-4 shrink-0" /></div>
      <p className="mt-3 break-words font-display text-2xl font-bold tabular-nums text-slate-900">{value} <span className="font-sans text-sm font-normal text-slate-500">{unit}</span></p>
      <p className="mt-2 flex items-center justify-between gap-2 text-xs leading-relaxed text-slate-500">{hint}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-600" /></p>
    </Link>)}
  </div>;
}
