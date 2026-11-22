const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export const SM2_QUALITY = {
  AGAIN: 1,
  HARD: 3,
  GOOD: 4,
  EASY: 5,
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function vietnamTodayKey(now = Date.now()) {
  const d = new Date(new Date(now).getTime() + VN_OFFSET_MS);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function addDaysToKey(dateKey, days) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ''));
  if (!m) return vietnamTodayKey();
  const [, year, month, day] = m.map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + Number(days || 0)));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function createInitialCardState(now = Date.now()) {
  return {
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewAt: vietnamTodayKey(now),
    lastReviewedAt: null,
    lapses: 0,
  };
}

export function calculateSM2(state = {}, quality, now = Date.now()) {
  const q = Math.min(5, Math.max(0, Math.round(Number(quality) || 0)));
  const prevEF = Number.isFinite(Number(state?.easeFactor)) ? Number(state.easeFactor) : 2.5;
  const prevRep = Number.isInteger(state?.repetitions) && state.repetitions >= 0 ? state.repetitions : 0;
  const prevInterval = Number.isFinite(Number(state?.interval)) && state.interval >= 0 ? Number(state.interval) : 0;
  const prevLapses = Number.isInteger(state?.lapses) && state.lapses >= 0 ? state.lapses : 0;

  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const easeFactor = Math.max(1.3, Number((prevEF + delta).toFixed(2)));

  let repetitions;
  let interval;
  let lapses = prevLapses;
  let needsRelearn = false;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
    lapses = prevLapses + 1;
    needsRelearn = true;
  } else {
    if (prevRep === 0) interval = 1;
    else if (prevRep === 1) interval = 6;
    else interval = Math.max(1, Math.round((prevInterval || 6) * easeFactor));
    repetitions = prevRep + 1;
  }

  return {
    repetitions,
    interval,
    easeFactor,
    nextReviewAt: addDaysToKey(vietnamTodayKey(now), interval),
    lastReviewedAt: new Date(now).toISOString(),
    lapses,
    needsRelearn,
  };
}

export function isCardDue(card, todayKey = vietnamTodayKey()) {
  if (!card?.nextReviewAt) return true;
  return String(card.nextReviewAt) <= todayKey;
}

export function getDeckSummary(cards = [], todayKey = vietnamTodayKey()) {
  const list = Array.isArray(cards) ? cards : [];
  const total = list.length;
  const dueNow = list.filter((c) => isCardDue(c, todayKey)).length;
  const mastered = list.filter((c) => (c?.repetitions || 0) >= 2 && (c?.interval || 0) >= 6).length;
  const learning = total - mastered;
  const avgEaseFactor = total > 0
    ? Number((list.reduce((sum, c) => sum + (Number.isFinite(c?.easeFactor) ? c.easeFactor : 2.5), 0) / total).toFixed(2))
    : 2.5;

  return {
    total,
    dueNow,
    mastered,
    learning,
    avgEaseFactor,
  };
}
