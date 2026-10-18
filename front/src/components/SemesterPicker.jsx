import { useEffect, useState } from 'react';
import { useSemester } from '../hooks/useSemester';
import useDataRevision from '../hooks/useDataRevision';
import { academicService } from '../services/academicService';
import { timetableService } from '../services/timetableService';
import { useAuth } from '../context/AuthContext';

export default function SemesterPicker() {
  const [semester, setSemester] = useSemester();
  const [semesters, setSemesters] = useState([]);
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();
  const revision = useDataRevision();
  useEffect(() => {
    let active = true;
    Promise.allSettled([academicService.layDanhSachMonHoc(), timetableService.layThoiKhoaBieu()]).then(([subjects, classes]) => {
      const values = [...(subjects.value?.data?.monHocs || []), ...(classes.value?.data?.thoiKhoaBieu || [])].map((item) => item.hocKy).filter(Boolean);
      if (active) setSemesters([...new Set(values)].sort((a, b) => b.localeCompare(a, 'vi', { numeric: true })));
    });
    return () => { active = false; };
  }, [revision, user?.id]);
  const options = [...new Set([semester, ...semesters].filter(Boolean))];
  return <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
    <label className="flex items-center gap-2 min-w-0"><span className="shrink-0 text-slate-600">Học kỳ</span><select aria-label="Học kỳ đang xem" value={semester} onChange={(e) => setSemester(e.target.value)} className="min-w-0 max-w-[65vw] rounded-xl border border-slate-200 bg-white px-3 py-2"><option value="">Tất cả học kỳ</option>{options.map((value) => <option key={value}>{value}</option>)}</select></label>
    <button type="button" onClick={() => setAdding(!adding)} className="text-xs font-semibold text-ink-600">{adding ? 'Hủy' : '+ Học kỳ mới'}</button>
    {adding && <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); setSemester(new FormData(e.currentTarget).get('semester')); setAdding(false); }}><input aria-label="Tên học kỳ mới" name="semester" required maxLength={100} pattern=".*\S.*" placeholder="HK1 2026–2027" className="min-w-0 rounded-lg border px-3 py-2"/><button className="rounded-lg bg-ink-600 px-3 py-2 text-white">Chọn</button></form>}
  </div>;
}
