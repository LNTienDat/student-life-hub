import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SM2_QUALITY,
  addDaysToKey,
  calculateSM2,
  createInitialCardState,
  getDeckSummary,
  isCardDue,
  vietnamTodayKey,
} from '../src/utils/sm2.js';
import {
  clearDocumentDeck,
  deckStorageKey,
  deleteDeckCard,
  getDeckStats,
  getDueCards,
  reviewDeckCard,
  saveFlashcardsToDeck,
} from '../src/services/studyDeckService.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

test('calculateSM2 follows canonical SuperMemo-2 intervals and ease factor bounds', () => {
  const day0 = new Date('2026-11-22T09:00:00+07:00').getTime();
  const s0 = createInitialCardState(day0);

  // Rep 0 -> Rep 1 (Good = 4 -> 1 day, EF remains 2.5)
  const s1 = calculateSM2(s0, SM2_QUALITY.GOOD, day0);
  assert.equal(s1.repetitions, 1);
  assert.equal(s1.interval, 1);
  assert.equal(s1.easeFactor, 2.5);
  assert.equal(s1.nextReviewAt, '2026-11-23');
  assert.equal(s1.needsRelearn, false);

  // Rep 1 -> Rep 2 (Good = 4 -> 6 days, EF remains 2.5)
  const day1 = new Date('2026-11-23T09:00:00+07:00').getTime();
  const s2 = calculateSM2(s1, SM2_QUALITY.GOOD, day1);
  assert.equal(s2.repetitions, 2);
  assert.equal(s2.interval, 6);
  assert.equal(s2.easeFactor, 2.5);
  assert.equal(s2.nextReviewAt, '2026-11-29');

  // Rep 2 -> Rep 3 (Easy = 5 -> EF = 2.6, interval = round(6 * 2.6) = 16)
  const day7 = new Date('2026-11-29T09:00:00+07:00').getTime();
  const s3 = calculateSM2(s2, SM2_QUALITY.EASY, day7);
  assert.equal(s3.repetitions, 3);
  assert.equal(s3.easeFactor, 2.6);
  assert.equal(s3.interval, 16);
  assert.equal(s3.nextReviewAt, '2026-12-15');

  // Hard = 3 reduces ease factor by 0.14
  const sHard = calculateSM2({ repetitions: 1, interval: 1, easeFactor: 2.5 }, SM2_QUALITY.HARD, day1);
  assert.equal(sHard.easeFactor, 2.36);

  // Again = 1 resets repetitions to 0, interval to 1, increments lapses, and respects 1.3 EF floor
  const sReset = calculateSM2({ repetitions: 4, interval: 20, easeFactor: 1.4, lapses: 1 }, SM2_QUALITY.AGAIN, day7);
  assert.equal(sReset.repetitions, 0);
  assert.equal(sReset.interval, 1);
  assert.equal(sReset.lapses, 2);
  assert.equal(sReset.easeFactor, 1.3);
  assert.equal(sReset.needsRelearn, true);
});

test('Vietnam date helpers, isCardDue, and getDeckSummary work across timezone boundaries', () => {
  // 2026-11-22T20:00:00Z is already 2026-11-23T03:00:00+07:00 in Vietnam
  const lateUtcMs = new Date('2026-11-22T20:00:00Z').getTime();
  assert.equal(vietnamTodayKey(lateUtcMs), '2026-11-23');
  assert.equal(addDaysToKey('2026-11-29', 3), '2026-12-02');

  assert.equal(isCardDue({ nextReviewAt: '2026-11-23' }, '2026-11-23'), true);
  assert.equal(isCardDue({ nextReviewAt: '2026-11-24' }, '2026-11-23'), false);

  const summary = getDeckSummary([
    { repetitions: 2, interval: 6, easeFactor: 2.5, nextReviewAt: '2026-11-28' },
    { repetitions: 0, interval: 1, easeFactor: 2.3, nextReviewAt: '2026-11-23' },
  ], '2026-11-23');
  assert.deepEqual(summary, {
    total: 2,
    dueNow: 1,
    mastered: 1,
    learning: 1,
    avgEaseFactor: 2.4,
  });
});

test('studyDeckService isolates users, deduplicates saved flashcards, advances reviews, and cleans up safely', () => {
  const storage = createMemoryStorage();
  const day0 = new Date('2026-11-22T09:00:00+07:00').getTime();

  // Corrupt storage does not crash
  storage.setItem(deckStorageKey(101), '{bad-json');
  assert.equal(getDueCards(101, null, day0, storage).length, 0);

  const sampleCards = [
    { id: 'c1', matTruoc: 'pip là gì?', matSau: 'Trình quản lý gói của Python.', trang: 1, trichDan: 'Dùng pip tải...' },
    { id: 'c2', matTruoc: 'import math dùng làm gì?', matSau: 'Dùng các hàm toán học.', trang: 2, trichDan: 'import math' },
  ];

  const firstSave = saveFlashcardsToDeck(101, { docId: 9, docTitle: 'Python Ch1', flashcards: sampleCards }, day0, storage);
  assert.equal(firstSave.added, 2);
  assert.equal(firstSave.total, 2);

  // Re-saving duplicate cards is skipped
  const secondSave = saveFlashcardsToDeck(101, { docId: 9, docTitle: 'Python Ch1', flashcards: sampleCards }, day0, storage);
  assert.equal(secondSave.added, 0);
  assert.equal(secondSave.skipped, 2);

  // Multi-user isolation: User 202 sees 0 cards
  assert.equal(getDeckStats(202, null, day0, storage).total, 0);

  // Reviewing card c1 with GOOD moves its nextReviewAt to tomorrow -> leaves only 1 due card today
  assert.equal(getDueCards(101, 9, day0, storage).length, 2);
  const reviewed = reviewDeckCard(101, 'c1', SM2_QUALITY.GOOD, day0, storage);
  assert.equal(reviewed.nextReviewAt, '2026-11-23');
  assert.equal(getDueCards(101, 9, day0, storage).length, 1);

  const statsAfter = getDeckStats(101, null, day0, storage);
  assert.equal(statsAfter.dueNow, 1);
  assert.equal(statsAfter.totalReviews, 1);

  // Single card delete & clear by document
  assert.equal(deleteDeckCard(101, 'c1', storage), true);
  assert.equal(getDeckStats(101, 9, day0, storage).total, 1);
  assert.equal(clearDocumentDeck(101, 9, storage), 1);
  assert.equal(getDeckStats(101, null, day0, storage).total, 0);
});
