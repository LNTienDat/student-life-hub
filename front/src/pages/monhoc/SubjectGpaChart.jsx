import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';

function SubjectGpaChart({ gpaTheoKy = [], displayMode = 'both' }) {
  useLanguage();
  if (!gpaTheoKy || gpaTheoKy.length <= 1) return null;

  const useScale4 = displayMode === '4';
  const chartData = gpaTheoKy.map((item) => ({
    ...item,
    gpaValue: useScale4 ? Number(item.gpaHe4 || 0) : Number(item.gpa || 0),
  }));

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60">
      <h2 className="font-display font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
        <BarChartIcon className="w-5 h-5 text-ink-500 dark:text-ink-300" />
        {tr("Biểu đồ GPA theo học kỳ")} {useScale4 ? '(Hệ 4)' : '(Hệ 10)'}
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="hocKy" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
          <YAxis domain={[0, useScale4 ? 4 : 10]} fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value, name, item) => [
              `${item?.payload?.gpa ?? value} / 10${item?.payload?.gpaHe4 ? ` (${item.payload.gpaHe4} / 4)` : ''}`,
              'GPA',
            ]}
          />
          <Bar dataKey="gpaValue" fill="#3D3F72" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SubjectGpaChart;
