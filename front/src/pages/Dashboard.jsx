import { t as tr, getLocale } from '../i18n/language';
import useLanguage from '../hooks/useLanguage';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCurrentSemester } from '../context/SemesterContext';
import { useAuth } from '../context/AuthContext';
import useDataRevision from '../hooks/useDataRevision';
import QuickEntry from './dashboard/QuickEntry';
import { academicService } from '../services/academicService';
import { deadlineService } from '../services/deadlineService';
import { financeService } from '../services/financeService';
import { Plus, CalendarPlus, Wallet } from 'lucide-react';

import DashboardKpiCards from './dashboard/DashboardKpiCards';
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

const DASHBOARD_TIMEOUT_MS = 8000;

function withTimeout(promise, ms = DASHBOARD_TIMEOUT_MS) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error('Quá thời gian tải dữ liệu');
      err.code = 'TIMEOUT';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

function Dashboard() {
  useLanguage();
  const { user } = useAuth();
  const { currentSemester } = useCurrentSemester();
  const revision = useDataRevision();
  const semester = ''; // Today always shows all semesters; filters belong to the detail pages.
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
      ['gpa', () => academicService.tinhGPA(semester), (r) => r.data.hasGrades === false ? null : { gpa: r.data.gpa, gpaHe4: r.data.gpaHe4 }],
      ['deadlinesSapToi', () => deadlineService.layDeadlineSapToi(7, semester), (r) => r.data.deadlines || []],
      ['thongKeTaiChinh', () => financeService.layThongKe(), (r) => r.data],
    ];
    Promise.allSettled(sources.map(async ([key, request, select]) => {
      try {
        const result = await withTimeout(request());
        if (active) update((previous) => ({ ...previous, data: { ...previous.data, [key]: select(result) } }));
      } catch {
        if (active) update((previous) => ({ ...previous, errors: [...previous.errors, key] }));
      }
    })).then(() => { if (active) update((previous) => ({ ...previous, done: true })); });
    return () => { active = false; };
  }, [queryKey, semester]);

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="break-words font-display text-2xl font-bold tracking-tight text-slate-900">{tr("Xin chào, ")}{user?.ten || tr('bạn')}!</h1>
          <p className="mt-2 text-sm text-slate-500">{new Date().toLocaleDateString(getLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div aria-label={tr("Thêm nhanh")} className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {[
            ['deadline', 'Thêm việc', Plus, 'border-violet-300 bg-violet-50/70 text-violet-700 hover:bg-violet-100 dark:border-violet-700/60 dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-900/60 shadow-sm', 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30'],
            ['class', 'Thêm lịch', CalendarPlus, 'border-sky-300 bg-sky-50/70 text-sky-700 hover:bg-sky-100 dark:border-sky-700/60 dark:bg-sky-950/50 dark:text-sky-300 dark:hover:bg-sky-900/60 shadow-sm', 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-500/30'],
            ['expense', 'Ghi khoản chi', Wallet, 'border-emerald-300 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60 shadow-sm', 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30'],
          ].map(([kind, label, Icon, baseClass, activeClass]) => (
            <button
              key={kind}
              type="button"
              onClick={() => setQuickEntry(quickEntry === kind ? null : kind)}
              aria-expanded={quickEntry === kind}
              aria-pressed={quickEntry === kind}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                quickEntry === kind ? activeClass : baseClass
              }`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              <span>{tr(label)}</span>
            </button>
          ))}
        </div>
      </header>

      {quickEntry && <QuickEntry key={quickEntry} kind={quickEntry} onClose={() => setQuickEntry(null)} />}

      {errors.length > 0 && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex flex-wrap justify-between gap-2">
        <span>{tr("Một số số liệu chưa tải được. Các mục còn lại vẫn sử dụng được.")}</span>
        <button onClick={() => setRetry((value) => value + 1)} className="font-semibold underline">{tr("Thử lại")}</button>
      </div>}
      {loading && Object.keys(data).length === 0 ? <PageSkeleton /> : <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        <section aria-label={tr("Tổng quan")}>
        <DashboardKpiCards gpa={data.gpa?.gpa !== undefined ? data.gpa.gpa : data.gpa} gpaHe4={data.gpa?.gpaHe4} deadlinesSapToi={data.deadlinesSapToi} thongKeTaiChinh={data.thongKeTaiChinh} itemVariants={itemVariants} deadlineUnavailable={!data.deadlinesSapToi} semester={semester} /></section>
        <DashboardToday key={user?.id} userId={user?.id} semester={currentSemester} />
      </motion.div>}

    </div>
  );
}

export default Dashboard;
