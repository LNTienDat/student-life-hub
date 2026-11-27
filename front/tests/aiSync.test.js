import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadDeck,
  mergeStudyDecks,
  replaceDeckFromSync,
  saveFlashcardsToDeck,
  subscribeStudyDeck,
} from '../src/services/studyDeckService.js';
import {
  exportEdgeModel,
  mergeEdgeModels,
  replaceEdgeModelFromSync,
  subscribeEdgeAi,
  trainFinanceSample,
} from '../src/services/edgeAiService.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test('mergeStudyDecks merges empty local with remote deck cleanly', () => {
  const remoteDeck = {
    version: 1,
    userId: 7,
    totalReviews: 4,
    cards: [
      {
        id: 'r1',
        docId: 'doc-1',
        matTruoc: 'Big O của QuickSort trung bình?',
        matSau: 'O(n log n)',
        repetitions: 2,
        interval: 6,
        easeFactor: 2.5,
        nextReviewAt: '2026-12-01',
        lastReviewedAt: '2026-11-25T10:00:00.000Z',
      },
    ],
  };

  const merged = mergeStudyDecks({ version: 1, userId: 7, cards: [], totalReviews: 0 }, remoteDeck, 7);
  assert.equal(merged.changedLocal, true);
  assert.equal(merged.needsPush, false);
  assert.equal(merged.deck.cards.length, 1);
  assert.equal(merged.deck.totalReviews, 4);
});

test('mergeStudyDecks requests push when local has cards and remote is null', () => {
  const localDeck = {
    version: 1,
    userId: 7,
    totalReviews: 2,
    cards: [
      {
        id: 'l1',
        docId: 'doc-1',
        matTruoc: 'HTTP 401 là gì?',
        matSau: 'Chưa xác thực danh tính',
        repetitions: 1,
        interval: 1,
      },
    ],
  };

  const merged = mergeStudyDecks(localDeck, null, 7);
  assert.equal(merged.changedLocal, false);
  assert.equal(merged.needsPush, true);
  assert.equal(merged.deck.cards.length, 1);
  assert.equal(merged.deck.totalReviews, 2);
});

test('mergeStudyDecks deduplicates docId::front keeping newer lastReviewedAt and max totalReviews', () => {
  const localDeck = {
    version: 1,
    userId: 7,
    totalReviews: 5,
    cards: [
      {
        id: 'l1',
        docId: '10',
        matTruoc: '  ORM  là gì? ',
        matSau: 'Object-Relational Mapping',
        repetitions: 1,
        interval: 1,
        lastReviewedAt: '2026-11-24T08:00:00.000Z',
      },
      {
        id: 'l2',
        docId: '10',
        matTruoc: 'Chỉ có ở máy hiện tại',
        matSau: 'Local card',
        repetitions: 0,
        interval: 0,
      },
    ],
  };
  const remoteDeck = {
    version: 1,
    userId: 7,
    totalReviews: 8,
    cards: [
      {
        id: 'r1',
        docId: '10',
        matTruoc: 'ORM là gì?',
        matSau: 'Object-Relational Mapping',
        repetitions: 3,
        interval: 14,
        lastReviewedAt: '2026-11-26T09:00:00.000Z',
      },
    ],
  };

  const merged = mergeStudyDecks(localDeck, remoteDeck, 7);
  assert.equal(merged.changedLocal, true);
  assert.equal(merged.needsPush, true);
  assert.equal(merged.deck.cards.length, 2);
  assert.equal(merged.deck.totalReviews, 8);
  const orm = merged.deck.cards.find((c) => c.id === 'r1');
  assert.equal(orm.repetitions, 3);
  assert.equal(orm.interval, 14);
});

test('mergeStudyDecks caps total merged cards at 400 and filters corrupt remote cards', () => {
  const manyCards = Array.from({ length: 410 }, (_, idx) => ({
    id: `c_${idx}`,
    docId: '99',
    matTruoc: `Câu ${idx}`,
    matSau: `Trả lời ${idx}`,
    lastReviewedAt: new Date(Date.UTC(2026, 0, 1) + idx * 60000).toISOString(),
  }));

  const merged = mergeStudyDecks(
    { version: 1, userId: 7, cards: [], totalReviews: 0 },
    { version: 1, userId: 7, totalReviews: 1, cards: [...manyCards, { id: 'broken' }] },
    7,
  );
  assert.equal(merged.deck.cards.length, 400);
  assert.equal(merged.deck.cards[0].id, 'c_10');
  assert.equal(merged.deck.cards.at(-1).id, 'c_409');
});

test('replaceDeckFromSync notifies listeners with source=sync to prevent re-push loops', () => {
  const store = createMemoryStorage();
  const events = [];
  const unsub = subscribeStudyDeck((uid, meta) => events.push({ uid, meta }));
  try {
    saveFlashcardsToDeck(12, {
      docId: '1',
      flashcards: [{ id: 'a', matTruoc: 'Q1', matSau: 'A1' }],
    }, Date.now(), store);
    assert.deepEqual(events[0], { uid: 12, meta: { source: 'local' } });

    replaceDeckFromSync(12, {
      version: 1,
      userId: 12,
      totalReviews: 2,
      cards: [{ id: 'b', docId: '2', matTruoc: 'Q2', matSau: 'A2' }],
    }, store);
    assert.deepEqual(events[1], { uid: 12, meta: { source: 'sync' } });
    assert.equal(loadDeck(12, store).cards[0].id, 'b');
  } finally {
    unsub();
  }
});

test('mergeEdgeModels picks richer per-task model, handles null/corrupt remote, and emits source=sync', () => {
  const storeA = createMemoryStorage();
  const storeB = createMemoryStorage();

  trainFinanceSample({ userId: 5, loai: 'chi', danhMuc: 'an_uong', moTa: 'phở bò 50k', soTien: 50000, storage: storeA });
  trainFinanceSample({ userId: 5, loai: 'chi', danhMuc: 'an_uong', moTa: 'bún chả 45k', soTien: 45000, storage: storeA });
  trainFinanceSample({ userId: 5, loai: 'thu', danhMuc: 'luong', moTa: 'lương thực tập tháng', soTien: 4000000, storage: storeB });

  const localExport = exportEdgeModel(5, storeA);
  const remoteExport = exportEdgeModel(5, storeB);

  const nullRemote = mergeEdgeModels(localExport, null, 5);
  assert.equal(nullRemote.changedLocal, false);
  assert.equal(nullRemote.needsPush, true);

  const corruptRemote = mergeEdgeModels(localExport, { version: 99 }, 5);
  assert.equal(corruptRemote.changedLocal, false);
  assert.equal(corruptRemote.needsPush, true);

  const combined = mergeEdgeModels(localExport, remoteExport, 5);
  assert.equal(combined.changedLocal, true);
  assert.equal(combined.needsPush, true);
  assert.equal(combined.model.tasks.finance_chi.userSamples, 2);
  assert.equal(combined.model.tasks.finance_thu.userSamples, 1);

  const events = [];
  const unsub = subscribeEdgeAi((uid, meta) => events.push({ uid, meta }));
  try {
    const replaced = replaceEdgeModelFromSync(5, combined.model, storeA);
    assert.equal(replaced, true);
    assert.deepEqual(events[0], { uid: 5, meta: { source: 'sync' } });
  } finally {
    unsub();
  }
});
