import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CalendarDays, BookOpen, AlertCircle } from 'lucide-react';
import timetableService from '../services/timetableService';
import { CAC_THU, gioSangPhut } from './thoikhoabieu/timetableUtils';
import TimetableGrid from './thoikhoabieu/TimetableGrid';
import TimetableMobile from './thoikhoabieu/TimetableMobile';
import { PageSkeleton } from '../components/Skeleton';

function ChiaSeTKB() {
  const { token } = useParams();
  const [chuSoHuu, setChuSoHuu] = useState(null);
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(null);
  const [loadedToken, setLoadedToken] = useState(null);

  useEffect(() => {
    let active = true;
    async function taiTKB() {
      try {
        const res = await timetableService.xemPublic(token);
        if (!active) return;
        setLoi(null);
        setChuSoHuu(res.data.chuSoHuu);
        setDanhSach(res.data.thoiKhoaBieu || []);
      } catch (error) {
        if (!active) return;
        console.error(error);
        setLoi(error.response?.data?.message || 'Không thể tải thời khóa biểu này');
      } finally {
        if (active) { setLoadedToken(token); setDangTai(false); }
      }
    }
    taiTKB();
    return () => { active = false; };
  }, [token]);

  const buoiTheoThu = CAC_THU.reduce((map, t) => {
    map[t.gia] = danhSach
      .filter((bh) => bh.thu === t.gia)
      .sort((a, b) => gioSangPhut(a.gioBatDau) - gioSangPhut(b.gioBatDau));
    return map;
  }, {});

  if (dangTai || loadedToken !== token) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (loi) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Không thể xem thời khóa biểu</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{loi}</p>
          <button type="button" onClick={() => window.location.reload()} className="mb-4 text-sm font-semibold text-ink-600">Thử tải lại</button>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink-600 hover:bg-ink-700 text-white text-sm font-semibold transition-colors"
          >
            Đăng nhập vào Student Life Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner đầu trang (Public viewer info) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-ink-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {chuSoHuu?.ten?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                  Thời khóa biểu của {chuSoHuu?.ten}
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  Công khai (Chỉ xem)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {[chuSoHuu?.truong, chuSoHuu?.nganh, chuSoHuu?.khoaHoc].filter(Boolean).join(' • ') || 'Sinh viên'}
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-ink-600 dark:text-ink-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors w-fit"
          >
            <BookOpen className="w-3.5 h-3.5" /> Tạo thời khóa biểu của bạn
          </Link>
        </div>

        {/* Nội dung lưới TKB (Read-only) */}
        {danhSach.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-12 text-center">
            <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Thời khóa biểu chưa có buổi học nào</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
            <TimetableGrid buoiTheoThu={buoiTheoThu} readOnly />
            <TimetableMobile buoiTheoThu={buoiTheoThu} readOnly />
          </div>
        )}
      </div>
    </div>
  );
}

export default ChiaSeTKB;
