import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import ModalDialog from './ModalDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useLanguage from '../hooks/useLanguage';
import { t as tr } from '../i18n/language';
import { generateRagStudyPack } from '../services/ragStudyService';
import {
  deleteDeckCard,
  getAllDeckCards,
  getDeckStats,
  getDueCards,
  reviewDeckCard,
  saveFlashcardsToDeck,
  subscribeStudyDeck,
} from '../services/studyDeckService';
import { calculateSM2, SM2_QUALITY } from '../utils/sm2';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function RagStudyModal({ open, onClose, doc = null, initialTab = 'generate' }) {
  useLanguage();
  const { user } = useAuth();
  const { hienToast } = useToast();

  const [tab, setTab] = useState(doc ? initialTab : 'sm2');
  const [subTab, setSubTab] = useState('flashcards');
  const [chuDe, setChuDe] = useState('');
  const [soLuong, setSoLuong] = useState(6);
  const [dungAI, setDungAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pack, setPack] = useState(null);

  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [savedToDeck, setSavedToDeck] = useState(false);
  const [answers, setAnswers] = useState({});

  const [sm2Rev, setSm2Rev] = useState(0);
  const [sm2Flipped, setSm2Flipped] = useState(false);

  const abortRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeStudyDeck((changedUserId) => {
      if (!changedUserId || changedUserId === user?.id) {
        setSm2Rev((v) => v + 1);
      }
    });
    return () => {
      unsub();
      abortRef.current?.abort();
    };
  }, [user?.id]);

  const docIdFilter = doc?.id ?? null;

  const deckStats = useMemo(() => {
    if (sm2Rev < 0) return { total: 0, dueNow: 0, mastered: 0, learning: 0, avgEaseFactor: 2.5, totalReviews: 0 };
    return getDeckStats(user?.id, docIdFilter);
  }, [user?.id, docIdFilter, sm2Rev]);

  const dueCards = useMemo(() => {
    if (sm2Rev < 0) return [];
    return getDueCards(user?.id, docIdFilter);
  }, [user?.id, docIdFilter, sm2Rev]);

  const allScopedCards = useMemo(() => {
    if (sm2Rev < 0) return [];
    return getAllDeckCards(user?.id, docIdFilter);
  }, [user?.id, docIdFilter, sm2Rev]);

  const nextScheduledDate = useMemo(() => {
    if (!allScopedCards.length) return '';
    return [...allScopedCards]
      .map((c) => c.nextReviewAt)
      .filter(Boolean)
      .sort()[0] || '';
  }, [allScopedCards]);

  async function handleGenerate(event) {
    event.preventDefault();
    if (!doc?.id || loading) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');
    try {
      const res = await generateRagStudyPack(
        doc.id,
        { soLuong: Number(soLuong) || 6, chuDe: chuDe.trim(), dungAI },
        { signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      setPack(res.data);
      setCardIndex(0);
      setFlipped(false);
      setSavedToDeck(false);
      setAnswers({});
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err?.response?.data?.message || err?.message || 'Chưa tạo được bộ ôn tập. Hãy thử lại.');
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }

  function handleSaveDeck() {
    if (!user?.id || !pack?.flashcards?.length) return;
    const result = saveFlashcardsToDeck(user.id, {
      docId: pack.taiLieuId,
      docTitle: pack.tieuDe,
      flashcards: pack.flashcards,
    });
    setSavedToDeck(true);
    setSm2Rev((v) => v + 1);
    if (result.added > 0) {
      hienToast('success', tr('Đã lưu {0} thẻ vào bộ ôn tập SM-2.', result.added));
    } else {
      hienToast('info', tr('Các thẻ này đã có sẵn trong bộ ôn tập SM-2 của bạn.'));
    }
  }

  function handleRateSm2(quality) {
    if (!user?.id || !dueCards.length) return;
    const card = dueCards[0];
    const updated = reviewDeckCard(user.id, card.id, quality);
    setSm2Flipped(false);
    setSm2Rev((v) => v + 1);
    if (updated?.needsRelearn) {
      hienToast('info', tr('Đã đặt lại nhịp SM-2 — thẻ sẽ lặp lại vào ngày mai.'));
    }
  }

  function handleDeleteSm2Card(cardId) {
    if (!user?.id || !cardId) return;
    if (deleteDeckCard(user.id, cardId)) {
      setSm2Flipped(false);
      setSm2Rev((v) => v + 1);
    }
  }

  const flashcards = pack?.flashcards || [];
  const quizzes = pack?.quizzes || [];
  const safeIdx = flashcards.length ? Math.min(cardIndex, flashcards.length - 1) : 0;
  const activeCard = flashcards[safeIdx] || null;
  const currentSm2Card = dueCards[0] || null;

  const answeredCount = quizzes.filter((q) => answers[q.id] !== undefined).length;
  const correctCount = quizzes.filter((q) => answers[q.id] === q.dapAnDung).length;

  const modalTitle = doc
    ? tr('Ôn tập · {0}', doc.tieuDe)
    : tr('Ôn tập SM-2 Spaced Repetition');

  return (
    <ModalDialog
      open={open}
      onClose={() => {
        abortRef.current?.abort();
        onClose?.();
      }}
      busy={loading}
      title={modalTitle}
      wide
    >
      <div className="space-y-4">
        {doc && (
          <div role="tablist" aria-label={tr('Chế độ ôn tập RAG')} className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'generate'}
              onClick={() => setTab('generate')}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-colors ${
                tab === 'generate'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {tr('Tạo Quiz & Flashcard')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'sm2'}
              onClick={() => setTab('sm2')}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-colors ${
                tab === 'sm2'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <BrainCircuit className="h-4 w-4" aria-hidden="true" />
              <span>{tr('Ôn tập SM-2')}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                tab === 'sm2'
                  ? 'bg-white/20 text-white'
                  : deckStats.dueNow > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {deckStats.dueNow}
              </span>
            </button>
          </div>
        )}

        {tab === 'generate' && doc && (
          <div className="space-y-4">
            <form onSubmit={handleGenerate} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/50 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <label className="sm:col-span-3 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  {tr('Chủ đề trọng tâm (tùy chọn)')}
                  <input
                    type="text"
                    maxLength={160}
                    value={chuDe}
                    disabled={loading}
                    onChange={(e) => setChuDe(e.target.value)}
                    placeholder={tr('Ví dụ: Chương 1, cách tính GPA, câu lệnh pip...')}
                    className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  {tr('Số câu / thẻ')}
                  <select
                    value={soLuong}
                    disabled={loading}
                    onChange={(e) => setSoLuong(Number(e.target.value))}
                    className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {[4, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={dungAI}
                    disabled={loading}
                    onChange={(e) => setDungAI(e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600"
                  />
                  <span>{tr('Dùng Gemini AI tổng hợp (tự chuyển bộ tách RAG cục bộ nếu ngoại tuyến)')}</span>
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                  {loading ? tr('Đang tạo bộ ôn tập…') : tr('Tạo Quiz & Flashcard')}
                </button>
              </div>
              {error && <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-300">{tr(error)}</p>}
            </form>

            {pack && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex rounded-xl border border-slate-200 p-0.5 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSubTab('flashcards')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        subTab === 'flashcards'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                      {tr('Flashcards ({0})', flashcards.length)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubTab('quiz')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        subTab === 'quiz'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {tr('Trắc nghiệm ({0})', quizzes.length)}
                    </button>
                  </div>

                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    {pack.engine === 'gemini-rag' ? tr('Gemini RAG') : tr('Local RAG Extractor')}
                  </span>
                </div>

                {subTab === 'flashcards' && activeCard && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setFlipped((f) => !f)}
                      className="w-full min-h-[190px] rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50/50 p-6 text-left shadow-sm transition-all hover:border-indigo-300 dark:border-indigo-800/70 dark:from-slate-800 dark:to-indigo-950/30"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                          {flipped ? tr('Mặt sau · Đáp án') : tr('Mặt trước · Câu hỏi / Khái niệm')}
                        </span>
                        <span>{tr('Thẻ {0}/{1} · Trang {2}', safeIdx + 1, flashcards.length, activeCard.trang)}</span>
                      </div>
                      <p className="text-base font-medium leading-relaxed text-slate-900 dark:text-white whitespace-pre-wrap">
                        {flipped ? activeCard.matSau : activeCard.matTruoc}
                      </p>
                      {flipped && activeCard.trichDan && (
                        <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                          “{activeCard.trichDan}”
                        </p>
                      )}
                      <p className="mt-4 text-xs text-indigo-600 dark:text-indigo-300">
                        {flipped ? tr('Bấm để lật lại câu hỏi') : tr('Bấm vào thẻ để xem đáp án')}
                      </p>
                    </button>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={safeIdx === 0}
                          onClick={() => { setCardIndex((i) => Math.max(0, i - 1)); setFlipped(false); }}
                          aria-label={tr('Thẻ trước')}
                          className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-medium disabled:opacity-40 dark:border-slate-600"
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                          {tr('Trước')}
                        </button>
                        <button
                          type="button"
                          disabled={safeIdx >= flashcards.length - 1}
                          onClick={() => { setCardIndex((i) => Math.min(flashcards.length - 1, i + 1)); setFlipped(false); }}
                          aria-label={tr('Thẻ tiếp theo')}
                          className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-medium disabled:opacity-40 dark:border-slate-600"
                        >
                          {tr('Tiếp')}
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={!user?.id}
                          onClick={handleSaveDeck}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <BrainCircuit className="h-4 w-4" aria-hidden="true" />
                          {savedToDeck ? tr('Đã lưu vào bộ SM-2') : tr('Lưu vào bộ ôn tập SM-2')}
                        </button>
                        {savedToDeck && (
                          <button
                            type="button"
                            onClick={() => setTab('sm2')}
                            className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200"
                          >
                            {tr('Ôn ngay')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {subTab === 'quiz' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs dark:bg-slate-900/50">
                      <span>{tr('Đã trả lời: {0}/{1} · Đúng: {2}', answeredCount, quizzes.length, correctCount)}</span>
                      {answeredCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setAnswers({})}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          {tr('Làm lại')}
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {quizzes.map((q, qIdx) => {
                        const selected = answers[q.id];
                        const answered = selected !== undefined;
                        return (
                          <article key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {tr('Câu {0}:', qIdx + 1)} {q.cauHoi}
                              </h3>
                              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                                {tr('Trang {0}', q.trang)}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {q.luaChon.map((opt, optIdx) => {
                                const isChosen = selected === optIdx;
                                const isRight = optIdx === q.dapAnDung;
                                let style = 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-700';
                                if (answered) {
                                  if (isRight) style = 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200 font-medium';
                                  else if (isChosen) style = 'border-rose-400 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/60 dark:text-rose-200';
                                  else style = 'border-slate-200 bg-slate-50/40 text-slate-400 dark:border-slate-700 dark:text-slate-500';
                                }
                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    disabled={answered}
                                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                    className={`flex min-h-10 items-start gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${style}`}
                                  >
                                    <span className="font-bold shrink-0">{OPTION_LETTERS[optIdx]}.</span>
                                    <span className="min-w-0 flex-1 break-words">{opt}</span>
                                    {answered && isRight && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
                                    {answered && isChosen && !isRight && <XCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />}
                                  </button>
                                );
                              })}
                            </div>

                            {answered && (
                              <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
                                <strong>{tr('Giải thích:')}</strong> {q.giaiThich}
                              </p>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'sm2' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 dark:border-amber-800/60 dark:bg-amber-950/30">
                <p className="text-xs text-amber-800 dark:text-amber-300">{tr('Cần ôn hôm nay')}</p>
                <p className="mt-0.5 text-lg font-bold text-amber-900 dark:text-amber-100">{deckStats.dueNow}</p>
              </div>
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 dark:border-emerald-800/60 dark:bg-emerald-950/30">
                <p className="text-xs text-emerald-800 dark:text-emerald-300">{tr('Đã thuộc')}</p>
                <p className="mt-0.5 text-lg font-bold text-emerald-900 dark:text-emerald-100">{deckStats.mastered}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs text-slate-500 dark:text-slate-400">{tr('Tổng số thẻ')}</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">{deckStats.total}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs text-slate-500 dark:text-slate-400">{tr('Ease Factor TB')}</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">{deckStats.avgEaseFactor}</p>
              </div>
            </div>

            {currentSm2Card ? (
              <div className="space-y-3">
                <div className="rounded-2xl border-2 border-indigo-200 bg-white p-5 dark:border-indigo-800/70 dark:bg-slate-900/40 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-300">{currentSm2Card.docTitle}</span>
                      {' · '}
                      <span>{tr('Trang {0}', currentSm2Card.trang)}</span>
                      {' · '}
                      <span>{tr('Lặp #{0} · EF {1}', currentSm2Card.repetitions || 0, currentSm2Card.easeFactor || 2.5)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSm2Card(currentSm2Card.id)}
                      aria-label={tr('Xóa thẻ này')}
                      title={tr('Xóa thẻ khỏi bộ ôn tập')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-base font-semibold text-slate-900 dark:text-white whitespace-pre-wrap">
                    {currentSm2Card.matTruoc}
                  </p>

                  {sm2Flipped ? (
                    <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                        {currentSm2Card.matSau}
                      </p>
                      {currentSm2Card.trichDan && (
                        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          “{currentSm2Card.trichDan}”
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSm2Flipped(true)}
                      className="min-h-10 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      {tr('Xem đáp án')}
                    </button>
                  )}
                </div>

                {sm2Flipped && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {tr('Mức độ ghi nhớ của bạn (SM-2 sẽ tự tính ngày lặp tiếp theo):')}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { q: SM2_QUALITY.AGAIN, label: 'Quên', cls: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200' },
                        { q: SM2_QUALITY.HARD, label: 'Khó', cls: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200' },
                        { q: SM2_QUALITY.GOOD, label: 'Tốt', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' },
                        { q: SM2_QUALITY.EASY, label: 'Dễ', cls: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200' },
                      ].map((btn) => {
                        const next = calculateSM2(currentSm2Card, btn.q);
                        return (
                          <button
                            key={btn.q}
                            type="button"
                            onClick={() => handleRateSm2(btn.q)}
                            className={`flex min-h-11 flex-col items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${btn.cls}`}
                          >
                            <span>{tr(btn.label)}</span>
                            <span className="text-[11px] font-normal opacity-80">{tr('{0} ngày', next.interval)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-center dark:border-slate-700 dark:bg-slate-900/40 space-y-2">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {deckStats.total === 0
                    ? tr('Chưa có thẻ SM-2 nào được lưu.')
                    : tr('Tuyệt vời! Bạn đã hoàn thành toàn bộ thẻ cần ôn hôm nay.')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {deckStats.total === 0
                    ? tr('Hãy tạo Flashcard từ một tài liệu bất kỳ rồi bấm Lưu vào bộ ôn tập SM-2.')
                    : tr('Lịch ôn tiếp theo: {0}', nextScheduledDate || '—')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalDialog>
  );
}
