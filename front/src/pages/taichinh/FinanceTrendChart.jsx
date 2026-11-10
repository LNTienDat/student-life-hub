import { t as tr } from '../../i18n/language';
import useLanguage from '../../hooks/useLanguage';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Activity } from 'lucide-react';
import { dinhDangTien } from '../../utils/formatters';

function FinanceTrendChart({ xuHuong = [], periodLabel }) {
  useLanguage();
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col h-full">
      <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-indigo-500" />{tr("Thu/chi 6 tháng")}{periodLabel ? tr(' đến ') + periodLabel : ''}
      </h2>

      <div className="w-full h-[280px] min-w-0 overflow-hidden">
        {xuHuong.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={xuHuong} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="thang" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
              <YAxis
                domain={[0, xuHuong.some(item => Number(item.thu) > 0 || Number(item.chi) > 0) ? 'auto' : 100000]}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b' }}
                tickFormatter={(value) =>
                  value >= 1000000 ? `${(value / 1000000).toFixed(1)}tr` : value >= 1000 ? `${value / 1000}k` : `${value}đ`
                }
              />
              <Legend verticalAlign="top" height={28} />
              <Tooltip allowEscapeViewBox={{ x: false, y: false }}
                formatter={(value) => dinhDangTien(value)}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line
                type="monotone"
                isAnimationActive={false}
                dataKey="thu"
                stroke="#10b981"
                name={tr("Thu")}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                isAnimationActive={false}
                dataKey="chi"
                stroke="#ef4444"
                name={tr("Chi")}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">{tr("Chưa đủ dữ liệu")}</div>
        )}
      </div>
    </div>
  );
}

export default FinanceTrendChart;
