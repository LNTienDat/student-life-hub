import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';

function SubjectGpaChart({ gpaTheoKy = [] }) {
  if (!gpaTheoKy || gpaTheoKy.length <= 1) return null;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60">
      <h2 className="font-display font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
        <BarChartIcon className="w-5 h-5 text-ink-500 dark:text-ink-300" />
        Biểu đồ GPA theo học kỳ
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={gpaTheoKy} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="hocKy" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
          <YAxis domain={[0, 10]} fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="gpa" fill="#3D3F72" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SubjectGpaChart;
