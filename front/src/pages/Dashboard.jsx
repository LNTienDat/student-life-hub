import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import useDataRevision from '../hooks/useDataRevision';
import { useSemester } from '../hooks/useSemester';
import QuickEntry from './dashboard/QuickEntry';
import { academicService } from '../services/academicService';
import { deadlineService } from '../services/deadlineService';
import { financeService } from '../services/financeService';
import { Sparkles, Plus } from 'lucide-react';

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

  const queryKey = `${revision}:${semester}:${retry}:${user?.id}`;
  const data = result?.key === queryKey ? result.data : {};
  const errors = result?.key === queryKey ? result.errors : [];
  const loading = result?.key !== queryKey || !result.done;
  useEffect(() => {
    let active = true;
    const update = (change) => setResult((previous) => change(previous?.key === queryKey ? previous : { key: queryKey, data: {}, errors: [], done: false }));
    const sources = [
      ['gpa', () => academicService.tinhGPA(semester), (r) => r.data.gpa],
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Banner Chào Mừng & Quick Action */}
      <div
        style={{ backgroundColor: '#141527' }}
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6 text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-ink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-ink-200 text-xs font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{loiChaoTheoGio()}</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              Xin chào, {user?.ten || 'Bạn'}! 👋
            </h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Hãy kiểm tra các đầu điểm và deadline cần hoàn thành hôm nay để giữ nhịp học tập tốt nhất.
            </p>
          </div>

          <button
            type="button" onClick={() => setQuickEntry('deadline')}
            style={{ backgroundColor: '#ffffff', color: '#141527' }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-ink-900" />
            <span>Thêm việc cần làm</span>
          </button>
        </div>
      </div>

      {quickEntry && <QuickEntry key={quickEntry} kind={quickEntry} onClose={() => setQuickEntry(null)} />}
      <DashboardToday key={`${user?.id}:${semester}`} userId={user?.id} semester={semester} onQuickEntry={setQuickEntry} />

      {errors.length > 0 && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex flex-wrap justify-between gap-2">
        <span>Một số số liệu chưa tải được. Các mục còn lại vẫn sử dụng được.</span>
        <button onClick={() => setRetry((value) => value + 1)} className="font-semibold underline">Thử lại</button>
      </div>}
      {loading && Object.keys(data).length === 0 ? <PageSkeleton /> : <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        <DashboardKpiCards gpa={data.gpa} deadlinesSapToi={data.deadlinesSapToi} thongKeTaiChinh={data.thongKeTaiChinh} itemVariants={itemVariants} deadlineUnavailable={!data.deadlinesSapToi} semester={semester} />
        <DashboardWarnings monNguyCo={data.monNguyCo} nganSachVuot={data.nganSachVuot} itemVariants={itemVariants} />
        {(data.gpaTheoKy?.length > 0 || Object.keys(data.thongKeTaiChinh?.theoDanhMuc || {}).length > 0) && <DashboardCharts thongKeTaiChinh={data.thongKeTaiChinh} gpaTheoKy={data.gpaTheoKy} itemVariants={itemVariants} />}
      </motion.div>}

    </div>
  );
}

export default Dashboard;
