import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getCache, setCache } from '../services/apiCache';
import { academicService } from '../services/academicService';
import { deadlineService } from '../services/deadlineService';
import { financeService } from '../services/financeService';
import { Sparkles, Plus } from 'lucide-react';

import DashboardKpiCards from './dashboard/DashboardKpiCards';
import DashboardWarnings from './dashboard/DashboardWarnings';
import DashboardRecentLists from './dashboard/DashboardRecentLists';
import DashboardCharts from './dashboard/DashboardCharts';
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
  const cached = getCache('dashboard_cache');
  const [gpa, setGpa] = useState(cached?.gpa ?? null);
  const [deadlinesSapToi, setDeadlinesSapToi] = useState(cached?.deadlinesSapToi ?? []);
  const [monNguyCo, setMonNguyCo] = useState(cached?.monNguyCo ?? []);
  const [nganSachVuot, setNganSachVuot] = useState(cached?.nganSachVuot ?? []);
  const [thongKeTaiChinh, setThongKeTaiChinh] = useState(cached?.thongKeTaiChinh ?? null);
  const [gpaTheoKy, setGpaTheoKy] = useState(cached?.gpaTheoKy ?? []);
  const [dangTai, setDangTai] = useState(!cached);
  const [loiTai, setLoiTai] = useState(false);

  const taiDuLieu = async () => {
    setLoiTai(false);
    try {
      const [resGpa, resDeadline, resCanhBao, resTaiChinh, resNganSach, resGpaKy] =
        await Promise.all([
          academicService.tinhGPA(),
          deadlineService.layDeadlineSapToi(7),
          academicService.canhBaoMonNguyCo(),
          financeService.layThongKe(),
          financeService.layNganSach(),
          academicService.gpaTheoKy(),
        ]);

      const data = {
        gpa: resGpa.data.gpa,
        deadlinesSapToi: resDeadline.data.deadlines || [],
        monNguyCo: resCanhBao.data.monNguyCo || [],
        thongKeTaiChinh: resTaiChinh.data,
        nganSachVuot: resNganSach.data?.ketQua?.filter((ns) => ns.vuotNganSach) || [],
        gpaTheoKy: resGpaKy.data?.theoKy || [],
      };

      setGpa(data.gpa);
      setDeadlinesSapToi(data.deadlinesSapToi);
      setMonNguyCo(data.monNguyCo);
      setThongKeTaiChinh(data.thongKeTaiChinh);
      setNganSachVuot(data.nganSachVuot);
      setGpaTheoKy(data.gpaTheoKy);
      setCache('dashboard_cache', data);
    } catch (error) {
      console.error(error);
      setLoiTai(true);
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiDuLieu();
  }, []);

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
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-ink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-ink-200 text-xs font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{loiChaoTheoGio()}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Xin chào, {user?.ten || 'Bạn'}! 👋
            </h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Hãy kiểm tra các đầu điểm và deadline cần hoàn thành hôm nay để giữ nhịp học tập tốt nhất.
            </p>
          </div>

          <Link
            to="/deadline"
            style={{ backgroundColor: '#ffffff', color: '#141527' }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-ink-900" />
            <span>Thêm việc cần làm</span>
          </Link>
        </div>
      </div>

      {loiTai ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-center">Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng.</p>
          <button
            onClick={() => { setDangTai(true); taiDuLieu(); }}
            className="px-5 py-2.5 bg-ink-600 hover:bg-ink-700 text-white font-semibold rounded-xl transition-all"
          >
            Thử lại
          </button>
        </div>
      ) : dangTai ? (
        <PageSkeleton />
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <DashboardKpiCards
            gpa={gpa}
            deadlinesSapToi={deadlinesSapToi}
            thongKeTaiChinh={thongKeTaiChinh}
            itemVariants={itemVariants}
          />

          <DashboardWarnings
            monNguyCo={monNguyCo}
            nganSachVuot={nganSachVuot}
            itemVariants={itemVariants}
          />

          <DashboardRecentLists
            deadlinesSapToi={deadlinesSapToi}
            thongKeTaiChinh={thongKeTaiChinh}
            itemVariants={itemVariants}
          />

          <DashboardCharts
            thongKeTaiChinh={thongKeTaiChinh}
            gpaTheoKy={gpaTheoKy}
            itemVariants={itemVariants}
          />
        </motion.div>
      )}
    </div>
  );
}

export default Dashboard;
