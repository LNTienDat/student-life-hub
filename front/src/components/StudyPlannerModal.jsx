import { useState } from 'react';
import { CalendarPlus, CheckCircle2, ExternalLink, ShieldCheck, Sparkles, SlidersHorizontal } from 'lucide-react';
import ModalDialog from './ModalDialog';
import useLanguage from '../hooks/useLanguage';
import { t as tr } from '../i18n/language';
import plannerService from '../services/plannerService';
import { studySessionGoogleCalendarUrl } from '../utils/icsExport';
import { clearCache } from '../services/apiCache';
import { useToast } from '../context/ToastContext';

const PROMPT_SUGGESTIONS = [
  'Ưu tiên ôn môn điểm thấp và deadline gấp vào buổi tối trước 22h',
  'Học buổi sáng và chiều, nghỉ Chủ nhật, mỗi phiên 90 phút',
  'Lịch nhẹ nhàng 4 buổi/tuần, mỗi buổi 60 phút tránh giờ lên lớp',
];

const WEEKDAY_OPTIONS = [
  { id: 2, label: 'T2' },
  { id: 3, label: 'T3' },
  { id: 4, label: 'T4' },
  { id: 5, label: 'T5' },
  { id: 6, label: 'T6' },
  { id: 7, label: 'T7' },
  { id: 8, label: 'CN' },
];

export default function StudyPlannerModal({
  open,
  onClose,
  weekStart = '',
  semester = '',
  onApplied,
}) {
  useLanguage();
  const { hienToast } = useToast();

  const [prompt, setPrompt] = useState(PROMPT_SUGGESTIONS[0]);
  const [earliestHour, setEarliestHour] = useState(7);
  const [latestHour, setLatestHour] = useState(22);
  const [sessionMinutes, setSessionMinutes] = useState(90);
  const [totalSessionsTarget, setTotalSessionsTarget] = useState(6);
  const [maxSessionsPerDay, setMaxSessionsPerDay] = useState(2);
  const [avoidWeekdays, setAvoidWeekdays] = useState([]);
  const [useAI, setUseAI] = useState(true);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  function toggleAvoidDay(dayId) {
    setAvoidWeekdays((prev) => (prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]));
  }

  function toggleSession(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate(e) {
    if (e) e.preventDefault();
    if (loading || saving) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await plannerService.generateStudyPlan({
        prompt,
        weekStart,
        semester,
        useAI,
        dongYGuiAI: useAI,
        constraints: {
          earliestHour: Number(earliestHour),
          latestHour: Number(latestHour),
          sessionMinutes: Number(sessionMinutes),
          totalSessionsTarget: Number(totalSessionsTarget),
          maxSessionsPerDay: Number(maxSessionsPerDay),
          avoidWeekdays,
        },
      });
      setPlan(data);
      setSelectedIds(new Set((data.sessions || []).map((s) => s.id)));
    } catch (err) {
      setError(err?.response?.data?.message || 'Chưa tạo được lịch ôn tập. Hãy thử lại.');
    } finally {
      setLoading(false);
    }
  }

  const chosenSessions = (plan?.sessions || []).filter((s) => selectedIds.has(s.id));

  async function handleApplyDeadlines() {
    if (saving || loading || !chosenSessions.length) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await plannerService.applyPlanToDeadlines(chosenSessions);
      clearCache('dashboard_cache');
      hienToast('success', data.message || `Đã lưu ${chosenSessions.length} phiên ôn tập vào Deadline!`);
      onApplied?.();
      onClose?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Chưa lưu được kế hoạch vào Deadline.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalDialog open={open} onClose={onClose} busy={saving || loading} wide title="Xếp lịch ôn tập thông minh">
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2.5 text-xs text-indigo-900 dark:border-indigo-800/70 dark:bg-indigo-950/30 dark:text-indigo-200">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Neuro-Symbolic AI · Constraint Solver</span>
          </div>
          <span className="opacity-85">
            {tr("AI hiểu yêu cầu tự nhiên, bộ giải toán học bảo đảm 0 trùng lịch lên lớp.")}
          </span>
        </div>

        <form onSubmit={handleGenerate} className="space-y-3">
          <div>
            <label htmlFor="planner-prompt" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              {tr("Bạn muốn tập trung ôn gì trong tuần?")}
            </label>
            <textarea
              id="planner-prompt"
              rows={2}
              maxLength={600}
              disabled={loading || saving}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={tr("VD: Tuần này ưu tiên ôn Python và deadline gấp vào buổi tối trước 22h, nghỉ Chủ nhật...")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PROMPT_SUGGESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                disabled={loading || saving}
                onClick={() => setPrompt(item)}
                className={`rounded-lg border px-2.5 py-1 text-left text-xs transition-colors ${prompt === item ? 'border-indigo-400 bg-indigo-50 font-medium text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-200' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                {tr(item)}
              </button>
            ))}
          </div>

          <details className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
            <summary className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              {tr("Tùy chỉnh ràng buộc cứng (Symbolic)")}
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 text-xs">
              <label className="text-slate-600 dark:text-slate-300">
                {tr("Giờ bắt đầu sớm nhất")}
                <input type="number" min="5" max="20" value={earliestHour} onChange={(e) => setEarliestHour(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </label>
              <label className="text-slate-600 dark:text-slate-300">
                {tr("Giờ kết thúc muộn nhất")}
                <input type="number" min="8" max="24" value={latestHour} onChange={(e) => setLatestHour(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </label>
              <label className="text-slate-600 dark:text-slate-300">
                {tr("Thời lượng mỗi phiên")}
                <select value={sessionMinutes} onChange={(e) => setSessionMinutes(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                  <option value={60}>60 {tr("phút")}</option>
                  <option value={90}>90 {tr("phút")}</option>
                  <option value={120}>120 {tr("phút")}</option>
                </select>
              </label>
              <label className="text-slate-600 dark:text-slate-300">
                {tr("Số phiên trong tuần")}
                <input type="number" min="1" max="18" value={totalSessionsTarget} onChange={(e) => setTotalSessionsTarget(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </label>
              <label className="text-slate-600 dark:text-slate-300">
                {tr("Tối đa mỗi ngày")}
                <input type="number" min="1" max="4" value={maxSessionsPerDay} onChange={(e) => setMaxSessionsPerDay(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </label>
              <div className="col-span-2 sm:col-span-3">
                <span className="block text-slate-600 dark:text-slate-300 mb-1.5">{tr("Ngày nghỉ / tránh xếp lịch:")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAY_OPTIONS.map((d) => {
                    const active = avoidWeekdays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleAvoidDay(d.id)}
                        className={`rounded-lg border px-2.5 py-1 font-medium transition-colors ${active ? 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-200' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <label className="col-span-2 sm:col-span-3 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} className="h-4 w-4 accent-indigo-600 rounded" />
                <span>{tr("Dùng Gemini Neural Parser hiểu câu tự nhiên (tự chuyển bộ luật nội bộ nếu ngoại tuyến)")}</span>
              </label>
            </div>
          </details>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || saving}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              {loading ? tr('Đang tính lịch tối ưu…') : tr('Tạo lịch ôn tối ưu')}
            </button>
          </div>
        </form>

        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{tr(error)}</p>}

        {plan && (
          <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {plan.neural?.source === 'neural_gemini'
                    ? tr('Neural Gemini + Symbolic Solver')
                    : tr('Symbolic Constraint Solver')}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {plan.verification?.zeroClassOverlap && <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 font-medium dark:bg-slate-800"><CheckCircle2 className="h-3 w-3 text-emerald-600" />{tr("0 trùng lịch học")}</span>}
                {plan.verification?.zeroSelfOverlap && <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 font-medium dark:bg-slate-800"><CheckCircle2 className="h-3 w-3 text-emerald-600" />{tr("0 tự chồng giờ")}</span>}
                {plan.verification?.withinStudyWindow && plan.verification?.respectsAvoidedDays && <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 font-medium dark:bg-slate-800"><CheckCircle2 className="h-3 w-3 text-emerald-600" />{tr("Đúng khung giờ & ngày nghỉ")}</span>}
              </div>
            </div>

            {plan.neural?.summary && (
              <p className="text-xs text-slate-600 dark:text-slate-300">
                <strong>{tr("Chiến lược:")}</strong> {plan.neural.summary}
              </p>
            )}

            {plan.sessions?.length > 0 ? (
              <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                {plan.sessions.map((s) => {
                  const checked = selectedIds.has(s.id);
                  const calUrl = studySessionGoogleCalendarUrl(s);
                  return (
                    <div
                      key={s.id}
                      className={`rounded-xl border p-3 transition-colors ${checked ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/50' : 'border-slate-200/60 bg-slate-50/50 opacity-60 dark:border-slate-800'}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSession(s.id)}
                            className="mt-1 h-4 w-4 shrink-0 accent-indigo-600 rounded"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200">
                                {s.thu === 8 ? 'CN' : `T${s.thu}`} · {s.ngayHoc.split('-').reverse().slice(0, 2).join('/')}
                              </span>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {s.gioBatDau}–{s.gioKetThuc}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.priorityLevel === 'cao' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                {tr("Ưu tiên")} {s.priorityScore}
                              </span>
                            </div>
                            <p className="mt-1 font-semibold text-slate-900 dark:text-white break-words">{s.tieuDe}</p>
                            {s.reasons?.length > 0 && (
                              <ul className="mt-1 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                {s.reasons.slice(0, 3).map((r, i) => (
                                  <li key={i}>• {r}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </label>
                        {calUrl && (
                          <a
                            href={calUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            title={tr("Thêm phiên này vào Google Calendar Web")}
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />Google Calendar
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                {tr("Không tìm thấy khung giờ trống phù hợp trong tuần này. Bạn hãy thử mở rộng khung giờ học hoặc bỏ bớt ngày nghỉ.")}
              </p>
            )}

            {plan.unscheduled?.length > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {tr("Có {0} phiên chưa đủ chỗ trống trong tuần (bạn có thể tăng tối đa phiên/ngày hoặc nới giờ học).", plan.unscheduled.length)}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {tr("Tổng:")} <strong>{chosenSessions.length}</strong> {tr("phiên")} · <strong>{plan.stats?.totalHours || 0}h</strong>
              </span>
              <div className="flex gap-2">
                <button type="button" disabled={saving} onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
                  {tr("Đóng")}
                </button>
                <button
                  type="button"
                  disabled={saving || loading || !chosenSessions.length}
                  onClick={handleApplyDeadlines}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CalendarPlus className="h-4 w-4 shrink-0" />
                  {saving ? tr('Đang lưu…') : tr("Lưu {0} phiên thành Deadline", chosenSessions.length)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalDialog>
  );
}
