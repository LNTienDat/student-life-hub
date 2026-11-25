import { Activity, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import { useFinanceCategories } from '../../context/FinanceCategoryContext';
import useLanguage from '../../hooks/useLanguage';
import { getLocale, t as tr } from '../../i18n/language';

function formatMoney(amount, suffix = 'đ') {
  if (!Number.isFinite(Number(amount))) return '—';
  return `${Math.round(Number(amount)).toLocaleString(getLocale())} ${suffix}`;
}

export default function FinanceForecastCard({ duBao, periodLabel }) {
  useLanguage();
  const { label: categoryLabel } = useFinanceCategories();

  if (!duBao?.burnRate) return null;

  const { burnRate, anomalies, insights = [] } = duBao;
  const riskCategories = (burnRate.categoryForecasts || []).filter((c) => c.riskLevel !== 'safe');
  const txAnomalies = anomalies?.transactions || [];
  const spikes = anomalies?.categorySpikes || [];
  const hasAnomalies = txAnomalies.length > 0 || spikes.length > 0;

  return (
    <section
      aria-label={tr('Dự báo chi tiêu & Phát hiện bất thường')}
      className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-700/60 dark:bg-slate-800 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white">
              {tr('Dự báo chi tiêu & Phát hiện bất thường')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tr('Tháng {0}', periodLabel)}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-950/60 dark:text-indigo-300">
          <Activity className="h-3.5 w-3.5" aria-hidden="true" />
          {tr('Dự báo')}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-700/60 dark:bg-slate-900/40">
          <p className="text-xs text-slate-500 dark:text-slate-400">{tr('Tốc độ chi / ngày')}</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {formatMoney(burnRate.effectiveDailyRate)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {burnRate.recent7DailyRate !== null
              ? tr('7 ngày gần nhất: {0}/ngày', formatMoney(burnRate.recent7DailyRate))
              : tr('Tính trên {0}/{1} ngày', burnRate.elapsedDays, burnRate.daysInMonth)}
          </p>
        </div>

        <div className={`rounded-xl border p-3.5 ${
          burnRate.willExceedBudget
            ? 'border-rose-200 bg-rose-50/70 dark:border-rose-800/70 dark:bg-rose-950/30'
            : 'border-slate-200/80 bg-slate-50/70 dark:border-slate-700/60 dark:bg-slate-900/40'
        }`}>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {burnRate.periodStatus === 'past' ? tr('Tổng chi thực tế') : tr('Dự phóng cuối tháng')}
          </p>
          <p className={`mt-1 text-lg font-bold ${
            burnRate.willExceedBudget
              ? 'text-rose-700 dark:text-rose-300'
              : 'text-slate-900 dark:text-white'
          }`}>
            {formatMoney(burnRate.projectedMonthEndSpent)}
          </p>
          {burnRate.totalBudget > 0 ? (
            <p className={`mt-0.5 text-[11px] font-medium ${
              burnRate.willExceedBudget
                ? 'text-rose-600 dark:text-rose-300'
                : 'text-emerald-700 dark:text-emerald-300'
            }`}>
              {burnRate.willExceedBudget
                ? tr('Dự kiến vượt ngân sách {0}', formatMoney(burnRate.projectedOverrun))
                : tr('Trong ngân sách ({0})', formatMoney(burnRate.totalBudget))}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              {tr('Chưa đặt ngân sách tháng')}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-700/60 dark:bg-slate-900/40">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {burnRate.safeDailyAllowance !== null ? tr('Hạn mức an toàn / ngày') : tr('Ngân sách còn lại')}
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {burnRate.safeDailyAllowance !== null
              ? formatMoney(burnRate.safeDailyAllowance)
              : burnRate.remainingBudget !== null
                ? formatMoney(burnRate.remainingBudget)
                : '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {burnRate.daysUntilBudgetDepleted !== null
              ? (burnRate.daysUntilBudgetDepleted === 0
                ? tr('Đã chạm hạn mức ngân sách')
                : tr('Đủ chi khoảng {0} ngày ở nhịp này', burnRate.daysUntilBudgetDepleted))
              : tr('Còn {0} ngày trong tháng', burnRate.remainingDays)}
          </p>
        </div>
      </div>

      {riskCategories.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {tr('Danh mục có nguy cơ vượt ngân sách:')}
          </p>
          <div className="flex flex-wrap gap-2">
            {riskCategories.map((cat) => (
              <span
                key={cat.danhMuc}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium ${
                  cat.riskLevel === 'exceeded' || cat.riskLevel === 'high_risk'
                    ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/70 dark:bg-rose-950/50 dark:text-rose-200'
                    : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-200'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{categoryLabel(cat.danhMuc, 'chi')}:</span>
                <strong>{tr('dự phóng {0}%', cat.projectedPct)}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {hasAnomalies ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 dark:border-amber-800/70 dark:bg-amber-950/30 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>{tr('Phát hiện {0} dấu hiệu chi tiêu bất thường', anomalies.totalCount)}</span>
          </p>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200">
            {txAnomalies.map((tx, idx) => (
              <li key={tx.id ?? idx} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 px-2.5 py-1.5 dark:bg-slate-900/50">
                <div className="min-w-0">
                  <span className="font-semibold">{tx.moTa || categoryLabel(tx.danhMuc, 'chi')}</span>
                  {' · '}
                  <span className="text-rose-700 dark:text-rose-300 font-semibold">{formatMoney(tx.soTien)}</span>
                  <span className="ml-1.5 text-slate-500 dark:text-slate-400">({tx.reason})</span>
                </div>
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                  tx.severity === 'high'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {tx.severity === 'high' ? tr('Tăng đột biến') : tr('Cao bất thường')}
                </span>
              </li>
            ))}
            {spikes.map((sp) => (
              <li key={sp.danhMuc} className="rounded-lg bg-white/80 px-2.5 py-1.5 dark:bg-slate-900/50">
                <strong>{categoryLabel(sp.danhMuc, 'chi')}:</strong>{' '}
                {tr('chi {0}, tăng +{1}% so với trung bình các tháng trước ({2})', formatMoney(sp.currentTotal), sp.spikePct, formatMoney(sp.previousAvg))}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{tr('Chưa phát hiện khoản chi bất thường.')}</span>
        </p>
      )}

      {insights.length > 0 && (
        <ul className="space-y-1 border-t border-slate-100 pt-2.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
          {insights.map((line, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden="true" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
