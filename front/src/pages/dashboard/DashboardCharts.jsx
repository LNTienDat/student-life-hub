import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { MAU_DANH_MUC } from '../../constants';
import { dinhDangTien } from '../../utils/formatters';

export default function DashboardCharts({ thongKeTaiChinh, gpaTheoKy, itemVariants }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Biểu đồ tròn chi tiêu */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 text-base">Cơ cấu chi tiêu</h2>
          <span className="text-xs text-slate-400 font-medium">Theo danh mục</span>
        </div>
        {!thongKeTaiChinh || Object.keys(thongKeTaiChinh?.theoDanhMuc || {}).length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            Chưa có đủ dữ liệu để vẽ biểu đồ.
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(thongKeTaiChinh?.theoDanhMuc || {}).map(([name, value]) => ({
                    name: name.replace('_', ' '),
                    value,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={52}
                  stroke="none"
                  paddingAngle={3}
                >
                  {Object.keys(thongKeTaiChinh.theoDanhMuc).map((_, index) => (
                    <Cell key={index} fill={MAU_DANH_MUC[index % MAU_DANH_MUC.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => dinhDangTien(value)}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Biểu đồ cột GPA theo kỳ */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 text-base">Xu hướng GPA theo kỳ</h2>
          <span className="text-xs text-slate-400 font-medium">Thang điểm 4</span>
        </div>
        {gpaTheoKy.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            Chưa có điểm học kỳ nào để hiển thị.
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gpaTheoKy} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="hocKy"
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 4]}
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="gpa" fill="#3D3F72" radius={[8, 8, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </div>
  );
}
