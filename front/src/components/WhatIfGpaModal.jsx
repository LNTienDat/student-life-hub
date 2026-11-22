import { useMemo, useState } from 'react';
import { Plus, RotateCcw, Target, Trash2, TrendingUp } from 'lucide-react';
import ModalDialog from './ModalDialog';
import useLanguage from '../hooks/useLanguage';
import { t as tr } from '../i18n/language';
import { GRADE_SCALE_PRESETS, toGpa4, toLetterGrade } from '../utils/gradeScale';
import { simulateWhatIfGpa, solveTargetGpaPath } from '../utils/gpaSimulator';

const TARGET_PRESETS = [
  { gpa4: 2.5, label: 'Khá (2.5)' },
  { gpa4: 3.2, label: 'Giỏi (3.2)' },
  { gpa4: 3.6, label: 'Xuất sắc (3.6)' },
];

export default function WhatIfGpaModal({ open, onClose, subjects = [], scaleId = '8_level' }) {
  useLanguage();
  const [overrides, setOverrides] = useState({});
  const [hypotheticals, setHypotheticals] = useState([]);
  const [targetGpa4, setTargetGpa4] = useState(3.2);

  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState('3');
  const [newScore, setNewScore] = useState('8.5');

  const simulation = useMemo(
    () => simulateWhatIfGpa({ subjects, overrides, hypotheticalSubjects: hypotheticals, scaleId }),
    [subjects, overrides, hypotheticals, scaleId],
  );

  const targetPlan = useMemo(
    () => solveTargetGpaPath({ subjects, hypotheticalSubjects: hypotheticals, targetGpa4, scaleId }),
    [subjects, hypotheticals, targetGpa4, scaleId],
  );

  function addHypothetical(e) {
    e.preventDefault();
    const ten = newName.trim();
    const tinChi = Number(newCredits);
    const diem10 = Number(newScore);
    if (!ten || !Number.isInteger(tinChi) || tinChi < 1 || tinChi > 20 || !Number.isFinite(diem10) || diem10 < 0 || diem10 > 10) {
      return;
    }
    setHypotheticals((prev) => [
      ...prev,
      { id: `hyp_${Date.now()}_${prev.length}`, ten, tinChi, diem10: Math.round(diem10 * 100) / 100 },
    ]);
    setNewName('');
  }

  function resetAll() {
    setOverrides({});
    setHypotheticals([]);
  }

  const hasChanges = Object.keys(overrides).length > 0 || hypotheticals.length > 0;
  const presetLabel = GRADE_SCALE_PRESETS[scaleId]?.shortLabel || '';

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={tr('Giả lập GPA tương lai (What-If Simulator)')}
      wide
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {tr('Chế độ giả lập — không làm thay đổi bảng điểm đã lưu. Quy chuẩn đang áp dụng:')}{' '}
          <strong>{tr(presetLabel)}</strong>
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('GPA hiện tại')}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {simulation.current.gpa4 !== null ? `${simulation.current.gpa4.toFixed(2)} / 4` : '—'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({simulation.current.gpa10 !== null ? `${simulation.current.gpa10.toFixed(2)} / 10` : '—'})
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {simulation.current.classification ? tr(simulation.current.classification) : tr('Chưa có điểm')}
              {' · '}
              {simulation.current.gradedCredits}/{simulation.current.totalCredits} TC
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-800/70 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{tr('GPA giả lập (What-If)')}</p>
              {simulation.deltaGpa4 !== null && simulation.deltaGpa4 !== 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  simulation.deltaGpa4 > 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {simulation.deltaGpa4 > 0 ? `+${simulation.deltaGpa4.toFixed(2)}` : simulation.deltaGpa4.toFixed(2)} GPA4
                </span>
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-indigo-900 dark:text-white">
                {simulation.simulated.gpa4 !== null ? `${simulation.simulated.gpa4.toFixed(2)} / 4` : '—'}
              </span>
              <span className="text-xs text-indigo-700/80 dark:text-indigo-300">
                ({simulation.simulated.gpa10 !== null ? `${simulation.simulated.gpa10.toFixed(2)} / 10` : '—'})
              </span>
            </div>
            <p className="mt-1 text-xs text-indigo-800 dark:text-indigo-200">
              {simulation.simulated.classification ? tr(simulation.simulated.classification) : tr('Chưa có điểm')}
              {simulation.rankChanged && (
                <span className="ml-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
                  · {tr('Đổi xếp loại!')}
                </span>
              )}
            </p>
          </div>
        </div>

        <section aria-label={tr('Tính điểm mục tiêu')} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-700 dark:bg-slate-900/40 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <span>{tr('Mục tiêu GPA tích lũy')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TARGET_PRESETS.map((preset) => (
                <button
                  key={preset.gpa4}
                  type="button"
                  onClick={() => setTargetGpa4(preset.gpa4)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    targetGpa4 === preset.gpa4
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tr(preset.label)}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {targetPlan.totalCredits === 0
              ? tr('Hãy thêm ít nhất một môn học có tín chỉ để tính lộ trình GPA.')
              : targetPlan.remainingCredits === 0
                ? (targetPlan.alreadyReached
                  ? tr('Tất cả môn hiện tại đã đủ trọng số và đã đạt mục tiêu {0}/4.', targetPlan.targetGpa4.toFixed(1))
                  : tr('Tất cả môn hiện tại đã chốt 100% trọng số. Hãy thêm môn giả lập kỳ tới để kéo GPA lên {0}/4.', targetPlan.targetGpa4.toFixed(1)))
                : targetPlan.alreadyReached
                  ? tr('Bạn đã vượt ngưỡng an toàn cho mục tiêu {0}/4.', targetPlan.targetGpa4.toFixed(1))
                  : targetPlan.achievable
                    ? tr('Trên {0} TC chưa chốt 100%, bạn cần đạt trung bình {1}/4 (~ mức {2}) để đạt GPA {3}/4.', targetPlan.remainingCredits, targetPlan.requiredAvgGpa4.toFixed(2), targetPlan.requiredLetter, targetPlan.targetGpa4.toFixed(1))
                    : tr('Ngay cả khi đạt 4.0 toàn bộ {0} TC còn lại, GPA tối đa là {1}/4 (chưa đủ {2}/4). Hãy thêm môn kỳ sau.', targetPlan.remainingCredits, targetPlan.maxPossibleGpa4?.toFixed(2), targetPlan.targetGpa4.toFixed(1))}
          </p>
        </section>

        {simulation.subjectImpacts.length > 0 && (
          <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
            {simulation.subjectImpacts.map((sub) => {
              const sliderVal = sub.overrideScore ?? (sub.simulated10 ?? 7.0);
              return (
                <div key={sub.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/80 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 font-semibold text-slate-800 dark:text-slate-100">
                      <span className="break-words">{sub.ten}</span>
                      <span className="ml-1.5 font-normal text-slate-500 dark:text-slate-400">({sub.tinChi} TC)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">
                        {sub.mode === 'remaining_weight'
                          ? tr('Giả lập {0}% còn lại:', sub.remainingWeight)
                          : tr('Tổng kết giả lập:')}
                      </span>
                      <strong className="text-indigo-700 dark:text-indigo-300">
                        {sub.simulated10 !== null ? `${sub.simulated10.toFixed(2)} (${sub.simulatedLetter})` : '—'}
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      aria-label={tr('Điều chỉnh điểm giả lập cho {0}', sub.ten)}
                      value={sliderVal}
                      onChange={(e) => setOverrides((prev) => ({ ...prev, [sub.id]: Number(e.target.value) }))}
                      className="h-2 flex-1 accent-indigo-600"
                    />
                    <span className="w-12 text-right text-xs font-mono text-slate-700 dark:text-slate-200">
                      {Number(sliderVal).toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={addHypothetical} className="rounded-2xl border border-dashed border-slate-300 p-3 dark:border-slate-600 space-y-2.5">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {tr('+ Thêm môn giả lập (kỳ hiện tại hoặc kỳ tới)')}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
            <input
              type="text"
              maxLength={120}
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={tr('Tên môn giả lập (VD: Đồ án chuyên ngành)')}
              className="sm:col-span-6 min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="number"
              min="1"
              max="20"
              required
              value={newCredits}
              onChange={(e) => setNewCredits(e.target.value)}
              aria-label={tr('Số tín chỉ')}
              className="sm:col-span-2 min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              required
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              aria-label={tr('Điểm dự kiến (thang 10)')}
              className="sm:col-span-2 min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              className="sm:col-span-2 inline-flex min-h-9 items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {tr('Thêm')}
            </button>
          </div>
          {hypotheticals.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {hypotheticals.map((h) => (
                <span key={h.id} className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200">
                  <span>{h.ten} · {h.tinChi}TC · {h.diem10.toFixed(1)} ({toLetterGrade(h.diem10, scaleId)} / {toGpa4(h.diem10, scaleId)})</span>
                  <button
                    type="button"
                    onClick={() => setHypotheticals((prev) => prev.filter((item) => item.id !== h.id))}
                    aria-label={tr('Xóa môn giả lập {0}', h.ten)}
                    className="text-indigo-600 hover:text-rose-600 dark:text-indigo-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            disabled={!hasChanges}
            onClick={resetAll}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {tr('Đặt lại về thực tế')}
          </button>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            {tr('Tính theo trọng số tín chỉ chuẩn')}
          </span>
        </div>
      </div>
    </ModalDialog>
  );
}
