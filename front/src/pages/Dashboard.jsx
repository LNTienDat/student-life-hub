import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import useDataRevision from '../hooks/useDataRevision';
import { useSemester } from '../hooks/useSemester';
import QuickEntry from './dashboard/QuickEntry';
import { academicService } from '../services/academicService';
import { deadlineService } from '../services/deadlineService';
import { financeService } from '../services/financeService';
import { Plus, ChevronDown } from 'lucide-react';

import DashboardKpiCards from './dashboard/DashboardKpiCards';
import DashboardWarnings from './dashboard/DashboardWarnings';
import DashboardCharts from './dashboard/DashboardCharts';
import DashboardToday from './dashboard/DashboardToday';
import { PageSkeleton } from '../components/Skeleton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

function Dashboard() {
  const { user } = useAuth();
  const revision = useDataRevision();
  const [semester] = useSemester();
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const [quickEntry, setQuickEntry] = useState(null);
  const [showCharts, setShowCharts] = useState(false);

  const queryKey = `${revision}:${semester}:${retry}:${user?.id}`;
  const data = result?.key === queryKey ? result.data : {};
  const errors = result?.key === queryKey ? result.errors : [];
  const loading = result?.key !== queryKey || !result.done;
  useEffect(() => {
    let active = true;
    const update = (change) => setResult((previous) => change(previous?.key === queryKey ? previous : { key: queryKey, data: {}, errors: [], done: false }));
    const sources = [
      ['gpa', () => academicService.tinhGPA(semester), (r) => r.data.hasGrades === false ? null : r.data.gpa],
      ['deadlinesSapToi', () => deadlineService.layDeadlineSapToi(7, semester), (r) => r.data.deadlines || []],
      ['monNguyCo', () => academicService.canhBaoMonNguyCo(5, semester), (r) => r.data.monNguyCo || []],
      ['thongKeTaiChinh', () => financeService.layThongKe(), (r) => r.data],
      ['nganSachVuot', () => financeService.layNganSach(), (r) => r.data.ketQua?.filter((item) => item.vuotNganSach) || []],
      ['gpaTheoKy', () => academicService.gpaTheoKy(), (r) => r.data.theoKy || []],
    ];
    Promise.allSettled(sources.map(async ([key, request, select]) => {
      try {
        const result = await request();
        if (active) update((previous) => ({ ...previous, data: { ...previous.data, [key]: select(result) } }));
      } catch {
        if (active) update((previous) => ({ ...previous, errors: [...previous.errors, key] }));
      }
    })).then(() => { if (active) update((previous) => ({ ...previous, done: true })); });
    return () => { active = false; };
  }, [queryKey, semester]);

  const loiChaoTheoGio = () => {
    const gio = new Date().getHours();
    if (gio < 12) return 'Buổi sáng năng lượng nhé';
    if (gio < 18) return 'Buổi chiều hiệu quả nhé';
    return 'Buổi tối bình an nhé';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="mb-1 text-sm text-slate-500">{loiChaoTheoGio()}</p>
          <h1 className="break-words font-display text-2xl font-bold tracking-tight text-slate-900">Xin chào, {user?.ten || 'bạn'}!</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">Lịch học, việc cần làm và chi tiêu trong ngày của bạn.</p>
        </div>
        <button type="button" onClick={() => setQuickEntry('deadline')} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-ink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-700">
          <Plus aria-hidden="true" className="h-4 w-4" />Thêm việc cần làm
        </button>
      </header>

      {quickEntry && <QuickEntry key={quickEntry} kind={quickEntry} onClose={() => setQuickEntry(null)} />}
      <DashboardToday key={`${user?.id}:${semester}`} userId={user?.id} semester={semester} onQuickEntry={setQuickEntry} />

      {errors.length > 0 && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex flex-wrap justify-between gap-2">
        <span>Một số số liệu chưa tải được. Các mục còn lại vẫn sử dụng được.</span>
        <button onClick={() => setRetry((value) => value + 1)} className="font-semibold underline">Thử lại</button>
      </div>}
      {loading && Object.keys(data).length === 0 ? <PageSkeleton /> : <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        <div className="border-t border-slate-200 pt-6"><h2 className="mb-3 text-base font-semibold text-slate-900">Tổng quan của bạn</h2>
        <DashboardKpiCards gpa={data.gpa} deadlinesSapToi={data.deadlinesSapToi} thongKeTaiChinh={data.thongKeTaiChinh} itemVariants={itemVariants} deadlineUnavailable={!data.deadlinesSapToi} semester={semester} /></div>
        <DashboardWarnings monNguyCo={data.monNguyCo} nganSachVuot={data.nganSachVuot} itemVariants={itemVariants} />
        {(data.gpaTheoKy?.length > 0 || Object.keys(data.thongKeTaiChinh?.theoDanhMuc || {}).length > 0) && <section>
          <button type="button" onClick={() => setShowCharts(!showCharts)} aria-expanded={showCharts} aria-controls="dashboard-charts" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-600">
            {showCharts ? 'Thu gọn biểu đồ' : 'Xem biểu đồ học tập và chi tiêu'}<ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${showCharts ? 'rotate-180' : ''}`} />
          </button>
          {showCharts && <div id="dashboard-charts" className="mt-3"><DashboardCharts thongKeTaiChinh={data.thongKeTaiChinh} gpaTheoKy={data.gpaTheoKy} itemVariants={itemVariants} /></div>}
        </section>}
      </motion.div>}

    </div>
  );
}

export default Dashboard;
