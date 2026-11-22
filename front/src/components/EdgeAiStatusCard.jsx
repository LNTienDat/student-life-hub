import { useEffect, useMemo, useState } from 'react';
import { Cpu, RotateCcw, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinanceCategories } from '../context/FinanceCategoryContext';
import useLanguage from '../hooks/useLanguage';
import { t as tr } from '../i18n/language';
import {
  getEdgeAiStats,
  predictDeadlinePriority,
  predictFinanceCategory,
  resetEdgeAiModel,
  subscribeEdgeAi,
} from '../services/edgeAiService';

const PRIORITY_LABELS = {
  cao: 'Khẩn cấp',
  binh_thuong: 'Bình thường',
  thap: 'Thấp',
};

export default function EdgeAiStatusCard() {
  useLanguage();
  const { user } = useAuth();
  const { categories, label: categoryLabel } = useFinanceCategories();

  const [rev, setRev] = useState(0);
  const [mode, setMode] = useState('chi'); // 'chi' | 'thu' | 'deadline'
  const [sampleText, setSampleText] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const unsub = subscribeEdgeAi((changedUserId) => {
      if (!changedUserId || changedUserId === user?.id) {
        setRev((v) => v + 1);
      }
    });
    return unsub;
  }, [user?.id]);

  const stats = useMemo(() => {
    if (rev < 0) return { financeSamples: 0, deadlineSamples: 0, totalSamples: 0, vocabSize: 0, feedbackHits: 0, feedbackTotal: 0, accuracyPct: null, storageBytes: 0 };
    return getEdgeAiStats(user?.id);
  }, [user?.id, rev]);

  const livePrediction = useMemo(() => {
    if (rev < 0 || sampleText.trim().length < 2) return null;
    if (mode === 'deadline') {
      return predictDeadlinePriority({
        userId: user?.id,
        title: sampleText,
      });
    }
    return predictFinanceCategory({
      userId: user?.id,
      text: sampleText,
      loai: mode,
      categories,
    });
  }, [user?.id, mode, sampleText, categories, rev]);

  function resolveLabel(code) {
    if (mode === 'deadline') return tr(PRIORITY_LABELS[code] || code);
    return categoryLabel(code, mode);
  }

  function handleReset() {
    if (!user?.id || !stats.totalSamples) return;
    resetEdgeAiModel(user.id);
    setRev((v) => v + 1);
    setNotice('Đã đặt lại dữ liệu EdgeAI đã học.');
  }

  return (
    <section
      aria-label={tr('EdgeAI trên thiết bị')}
      className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 space-y-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Cpu className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-200">
              {tr('EdgeAI trên thiết bị')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tr('Tự học thói quen phân loại thu/chi và độ ưu tiên deadline ngay trên trình duyệt.')}
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-300">
          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          {tr('100% Offline · 0 request mạng')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-700/60 dark:bg-slate-900/40">
          <p className="text-xs text-slate-500 dark:text-slate-400">{tr('Mẫu tài chính')}</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{stats.financeSamples}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-700/60 dark:bg-slate-900/40">
          <p className="text-xs text-slate-500 dark:text-slate-400">{tr('Mẫu deadline')}</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{stats.deadlineSamples}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-700/60 dark:bg-slate-900/40">
          <p className="text-xs text-slate-500 dark:text-slate-400">{tr('Độ khớp gợi ý')}</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {stats.accuracyPct === null ? '—' : `${stats.accuracyPct}%`}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-700/60 dark:bg-slate-900/40">
          <p className="text-xs text-slate-500 dark:text-slate-400">{tr('Bộ nhớ cục bộ')}</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {(stats.storageBytes / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {tr('Thử nghiệm suy luận ngoại tuyến')}
          </span>
          <div role="group" aria-label={tr('Chế độ thử EdgeAI')} className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
            {[
              ['chi', 'Chi tiêu'],
              ['thu', 'Thu nhập'],
              ['deadline', 'Deadline'],
            ].map(([value, labelText]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  mode === value
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {tr(labelText)}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          value={sampleText}
          onChange={(e) => {
            setSampleText(e.target.value);
            if (notice) setNotice('');
          }}
          placeholder={tr('Thử gõ: trà sữa 45k, đổ xăng, thi cuối kỳ...')}
          aria-label={tr('Nhập thử nội dung cho EdgeAI')}
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />

        {livePrediction && (
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5 text-slate-700 dark:text-slate-200">
                <span>{tr('Kết quả:')}</span>
                <strong className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  {resolveLabel(livePrediction.label)}
                </strong>
                <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                  {Math.round(livePrediction.confidence * 100)}%
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  · {livePrediction.latencyMs}ms ·{' '}
                  {livePrediction.source === 'personalized' ? tr('Đã cá nhân hóa') : tr('Nền tảng có sẵn')}
                </span>
              </div>
              {livePrediction.topFeatures?.length > 0 && (
                <span className="text-slate-500 dark:text-slate-400">
                  {tr('Đặc trưng:')} {livePrediction.topFeatures.join(', ')}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              {livePrediction.scores.map((item) => {
                const widthPct = Math.max(2, Math.round(item.probability * 100));
                return (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <span className="w-28 truncate text-slate-600 dark:text-slate-300">
                      {resolveLabel(item.label)}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-medium text-slate-600 dark:text-slate-300">
                      {Math.round(item.probability * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {notice ? tr(notice) : tr('Từ vựng trên máy: {0} đặc trưng', stats.vocabSize)}
        </p>
        <button
          type="button"
          disabled={!user?.id || stats.totalSamples === 0}
          onClick={handleReset}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {tr('Đặt lại mô hình đã học')}
        </button>
      </div>
    </section>
  );
}
