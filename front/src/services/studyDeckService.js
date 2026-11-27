import {
  calculateSM2,
  createInitialCardState,
  getDeckSummary,
  isCardDue,
  vietnamTodayKey,
} from '../utils/sm2.js';

const STORAGE_PREFIX = 'slh:sm2:v1:';
const MAX_CARDS = 400;
const listeners = new Set();

export function deckStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}

function isValidUserId(userId) {
  return Number.isSafeInteger(userId) && userId > 0;
}

function resolveStorage(explicitStorage) {
  if (explicitStorage && typeof explicitStorage.getItem === 'function' && typeof explicitStorage.setItem === 'function') {
    return explicitStorage;
  }
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage && typeof globalThis.localStorage.getItem === 'function') {
      return globalThis.localStorage;
    }
  } catch {
    // Storage disabled (e.g., private browsing).
  }
  return null;
}

function normalizeFront(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function fallbackCardId(docId, matTruoc, index) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sm2_${docId}_${Date.now()}_${index}_${normalizeFront(matTruoc).slice(0, 12)}`;
}

function notifyListeners(userId, meta = { source: 'local' }) {
  for (const fn of listeners) {
    try {
      fn(userId, meta);
    } catch {
      // Never break callers if a subscriber fails.
    }
  }
}

export function subscribeStudyDeck(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function loadDeck(userId, explicitStorage = null) {
  const empty = { version: 1, userId: isValidUserId(userId) ? userId : null, cards: [], totalReviews: 0 };
  const store = resolveStorage(explicitStorage);
  if (!store || !isValidUserId(userId)) return empty;

  try {
    const raw = store.getItem(deckStorageKey(userId));
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || parsed?.userId !== userId || !Array.isArray(parsed.cards)) {
      return empty;
    }
    return {
      version: 1,
      userId,
      cards: parsed.cards.filter((c) => c && typeof c.id === 'string' && typeof c.matTruoc === 'string' && typeof c.matSau === 'string'),
      totalReviews: Number.isInteger(parsed.totalReviews) && parsed.totalReviews >= 0 ? parsed.totalReviews : 0,
    };
  } catch {
    return empty;
  }
}

function saveDeck(userId, deck, explicitStorage = null) {
  const store = resolveStorage(explicitStorage);
  if (!store || !isValidUserId(userId)) return false;
  try {
    store.setItem(deckStorageKey(userId), JSON.stringify({
      version: 1,
      userId,
      updatedAt: Date.now(),
      totalReviews: deck.totalReviews || 0,
      cards: deck.cards.slice(-MAX_CARDS),
    }));
    return true;
  } catch {
    return false;
  }
}

export function saveFlashcardsToDeck(userId, { docId, docTitle = '', flashcards = [] } = {}, now = Date.now(), explicitStorage = null) {
  if (!isValidUserId(userId) || !Array.isArray(flashcards) || !flashcards.length) {
    return { added: 0, skipped: 0, total: loadDeck(userId, explicitStorage).cards.length };
  }

  const deck = loadDeck(userId, explicitStorage);
  const cleanDocId = String(docId ?? 'doc');
  const existingKeys = new Set(
    deck.cards.map((c) => `${c.docId}::${normalizeFront(c.matTruoc)}`),
  );

  let added = 0;
  let skipped = 0;

  flashcards.forEach((fc, idx) => {
    const front = String(fc?.matTruoc || '').trim();
    const back = String(fc?.matSau || '').trim();
    if (!front || !back) {
      skipped++;
      return;
    }
    const key = `${cleanDocId}::${normalizeFront(front)}`;
    if (existingKeys.has(key)) {
      skipped++;
      return;
    }
    existingKeys.add(key);
    deck.cards.push({
      id: fc.id ? String(fc.id) : fallbackCardId(cleanDocId, front, idx),
      docId: cleanDocId,
      docTitle: String(docTitle || 'Tài liệu'),
      matTruoc: front,
      matSau: back,
      trang: Number.isInteger(fc.trang) && fc.trang > 0 ? fc.trang : 1,
      trichDan: String(fc.trichDan || ''),
      ...createInitialCardState(now),
    });
    added++;
  });

  if (added > 0) {
    deck.cards = deck.cards.slice(-MAX_CARDS);
    saveDeck(userId, deck, explicitStorage);
    notifyListeners(userId);
  }

  return { added, skipped, total: deck.cards.length };
}

export function reviewDeckCard(userId, cardId, quality, now = Date.now(), explicitStorage = null) {
  if (!isValidUserId(userId) || !cardId) return null;
  const deck = loadDeck(userId, explicitStorage);
  const idx = deck.cards.findIndex((c) => c.id === cardId);
  if (idx < 0) return null;

  const updated = {
    ...deck.cards[idx],
    ...calculateSM2(deck.cards[idx], quality, now),
  };
  deck.cards[idx] = updated;
  deck.totalReviews = (deck.totalReviews || 0) + 1;
  saveDeck(userId, deck, explicitStorage);
  notifyListeners(userId);
  return updated;
}

export function deleteDeckCard(userId, cardId, explicitStorage = null) {
  if (!isValidUserId(userId) || !cardId) return false;
  const deck = loadDeck(userId, explicitStorage);
  const next = deck.cards.filter((c) => c.id !== cardId);
  if (next.length === deck.cards.length) return false;
  deck.cards = next;
  saveDeck(userId, deck, explicitStorage);
  notifyListeners(userId);
  return true;
}

export function clearDocumentDeck(userId, docId, explicitStorage = null) {
  if (!isValidUserId(userId) || docId === null || docId === undefined) return 0;
  const deck = loadDeck(userId, explicitStorage);
  const cleanDocId = String(docId);
  const next = deck.cards.filter((c) => c.docId !== cleanDocId);
  const removed = deck.cards.length - next.length;
  if (removed > 0) {
    deck.cards = next;
    saveDeck(userId, deck, explicitStorage);
    notifyListeners(userId);
  }
  return removed;
}

export function getDueCards(userId, docId = null, now = Date.now(), explicitStorage = null) {
  const deck = loadDeck(userId, explicitStorage);
  const todayKey = vietnamTodayKey(now);
  const filterByDoc = docId !== null && docId !== undefined && docId !== '';
  const cleanDocId = filterByDoc ? String(docId) : null;

  return deck.cards
    .filter((c) => (!filterByDoc || c.docId === cleanDocId) && isCardDue(c, todayKey))
    .sort((a, b) => String(a.nextReviewAt || '').localeCompare(String(b.nextReviewAt || '')));
}

export function getAllDeckCards(userId, docId = null, explicitStorage = null) {
  const deck = loadDeck(userId, explicitStorage);
  const filterByDoc = docId !== null && docId !== undefined && docId !== '';
  const cleanDocId = filterByDoc ? String(docId) : null;
  return filterByDoc ? deck.cards.filter((c) => c.docId === cleanDocId) : deck.cards;
}

export function getDeckStats(userId, docId = null, now = Date.now(), explicitStorage = null) {
  const deck = loadDeck(userId, explicitStorage);
  const filterByDoc = docId !== null && docId !== undefined && docId !== '';
  const cleanDocId = filterByDoc ? String(docId) : null;
  const scoped = filterByDoc ? deck.cards.filter((c) => c.docId === cleanDocId) : deck.cards;

  return {
    ...getDeckSummary(scoped, vietnamTodayKey(now)),
    totalReviews: deck.totalReviews || 0,
  };
}

function isValidCardShape(card) {
  return Boolean(
    card
    && typeof card.id === 'string'
    && card.id.trim()
    && typeof card.matTruoc === 'string'
    && card.matTruoc.trim()
    && typeof card.matSau === 'string'
    && card.matSau.trim(),
  );
}

function reviewTimestampMs(card) {
  if (!card?.lastReviewedAt) return 0;
  const parsed = Date.parse(card.lastReviewedAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareCardProgress(cardA, cardB) {
  const timeDiff = reviewTimestampMs(cardA) - reviewTimestampMs(cardB);
  if (timeDiff !== 0) return timeDiff;
  const repDiff = (Number(cardA?.repetitions) || 0) - (Number(cardB?.repetitions) || 0);
  if (repDiff !== 0) return repDiff;
  return (Number(cardA?.interval) || 0) - (Number(cardB?.interval) || 0);
}

function cardRecencyMs(card) {
  const reviewed = reviewTimestampMs(card);
  const created = card?.createdAt ? (Date.parse(card.createdAt) || 0) : 0;
  return Math.max(reviewed, created);
}

export function mergeStudyDecks(localDeck, remoteDeck, userId) {
  const localCards = Array.isArray(localDeck?.cards) ? localDeck.cards.filter(isValidCardShape) : [];
  const validRemote = Boolean(remoteDeck && Array.isArray(remoteDeck.cards));
  const remoteCards = validRemote ? remoteDeck.cards.filter(isValidCardShape) : [];

  const localMap = new Map();
  for (const card of localCards) {
    const key = `${String(card.docId ?? 'doc')}::${normalizeFront(card.matTruoc)}`;
    if (!localMap.has(key)) localMap.set(key, card);
  }

  const remoteMap = new Map();
  for (const card of remoteCards) {
    const key = `${String(card.docId ?? 'doc')}::${normalizeFront(card.matTruoc)}`;
    if (!remoteMap.has(key)) remoteMap.set(key, card);
  }

  const mergedMap = new Map();
  let changedLocal = false;
  let needsPush = false;

  for (const [key, localCard] of localMap.entries()) {
    const remoteCard = remoteMap.get(key);
    if (!remoteCard) {
      mergedMap.set(key, localCard);
      needsPush = true;
      continue;
    }
    const diff = compareCardProgress(remoteCard, localCard);
    if (diff > 0) {
      mergedMap.set(key, remoteCard);
      changedLocal = true;
    } else if (diff < 0) {
      mergedMap.set(key, localCard);
      needsPush = true;
    } else {
      mergedMap.set(key, localCard);
    }
  }

  for (const [key, remoteCard] of remoteMap.entries()) {
    if (!localMap.has(key)) {
      mergedMap.set(key, remoteCard);
      changedLocal = true;
    }
  }

  let mergedCards = [...mergedMap.values()];
  if (mergedCards.length > MAX_CARDS) {
    mergedCards = mergedCards
      .slice()
      .sort((a, b) => cardRecencyMs(a) - cardRecencyMs(b))
      .slice(-MAX_CARDS);
  }

  const localTotal = Number.isInteger(localDeck?.totalReviews) && localDeck.totalReviews >= 0 ? localDeck.totalReviews : 0;
  const remoteTotal = validRemote && Number.isInteger(remoteDeck.totalReviews) && remoteDeck.totalReviews >= 0
    ? remoteDeck.totalReviews
    : 0;
  const totalReviews = Math.max(localTotal, remoteTotal);

  if (remoteTotal > localTotal) changedLocal = true;
  if (!validRemote) {
    needsPush = mergedCards.length > 0 || totalReviews > 0;
  } else if (localTotal > remoteTotal) {
    needsPush = true;
  }

  return {
    deck: {
      version: 1,
      userId: isValidUserId(userId) ? userId : null,
      cards: mergedCards,
      totalReviews,
    },
    changedLocal,
    needsPush,
  };
}

export function replaceDeckFromSync(userId, deck, explicitStorage = null) {
  if (!isValidUserId(userId) || !deck || !Array.isArray(deck.cards)) return false;
  const sanitized = {
    version: 1,
    userId,
    totalReviews: Number.isInteger(deck.totalReviews) && deck.totalReviews >= 0 ? deck.totalReviews : 0,
    cards: deck.cards.filter(isValidCardShape).slice(-MAX_CARDS),
  };
  const ok = saveDeck(userId, sanitized, explicitStorage);
  if (ok) notifyListeners(userId, { source: 'sync' });
  return ok;
}
