import api from './api';
import {
  loadDeck,
  mergeStudyDecks,
  replaceDeckFromSync,
  subscribeStudyDeck,
} from './studyDeckService';
import {
  exportEdgeModel,
  mergeEdgeModels,
  replaceEdgeModelFromSync,
  subscribeEdgeAi,
} from './edgeAiService';

const PUSH_DEBOUNCE_MS = 1500;

function isValidUserId(userId) {
  return Number.isSafeInteger(userId) && userId > 0;
}

function isOnline() {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export async function pushStudyDeck(userId) {
  if (!isValidUserId(userId) || !isOnline()) return false;
  try {
    const deck = loadDeck(userId);
    await api.put('/sync/sm2', {
      version: 1,
      totalReviews: deck.totalReviews || 0,
      cards: deck.cards || [],
    });
    return true;
  } catch {
    return false;
  }
}

export async function pushEdgeModel(userId) {
  if (!isValidUserId(userId) || !isOnline()) return false;
  const exported = exportEdgeModel(userId);
  if (!exported) return false;
  try {
    await api.put('/sync/edge-ai', {
      version: 1,
      updatedAt: exported.updatedAt,
      tasks: exported.tasks,
    });
    return true;
  } catch {
    return false;
  }
}

export async function pushResetEdgeModel() {
  if (!isOnline()) return false;
  try {
    await api.delete('/sync/edge-ai');
    return true;
  } catch {
    return false;
  }
}

export async function hydrateAiSync(userId) {
  if (!isValidUserId(userId) || !isOnline()) {
    return { sm2Synced: false, edgeSynced: false };
  }

  const [sm2Res, edgeRes] = await Promise.allSettled([
    api.get('/sync/sm2'),
    api.get('/sync/edge-ai'),
  ]);

  let sm2Synced = false;
  if (sm2Res.status === 'fulfilled') {
    sm2Synced = true;
    try {
      const remoteDeck = sm2Res.value?.data?.deck || null;
      const { deck, changedLocal, needsPush } = mergeStudyDecks(loadDeck(userId), remoteDeck, userId);
      if (changedLocal) replaceDeckFromSync(userId, deck);
      if (needsPush) await pushStudyDeck(userId);
    } catch {
      // Never break app flow if local merge fails.
    }
  }

  let edgeSynced = false;
  if (edgeRes.status === 'fulfilled') {
    edgeSynced = true;
    try {
      const remoteModel = edgeRes.value?.data?.model || null;
      const { model, changedLocal, needsPush } = mergeEdgeModels(exportEdgeModel(userId), remoteModel, userId);
      if (changedLocal) replaceEdgeModelFromSync(userId, model);
      if (needsPush) await pushEdgeModel(userId);
    } catch {
      // Never break app flow if local merge fails.
    }
  }

  return { sm2Synced, edgeSynced };
}

export function startAiSyncBridge(userId) {
  if (!isValidUserId(userId)) return () => {};

  let disposed = false;
  let sm2Timer = null;
  let edgeTimer = null;

  hydrateAiSync(userId);

  const unsubDeck = subscribeStudyDeck((changedUserId, meta) => {
    if (disposed || changedUserId !== userId || meta?.source === 'sync') return;
    if (sm2Timer) clearTimeout(sm2Timer);
    sm2Timer = setTimeout(() => {
      if (!disposed) pushStudyDeck(userId);
    }, PUSH_DEBOUNCE_MS);
  });

  const unsubEdge = subscribeEdgeAi((changedUserId, meta) => {
    if (disposed || changedUserId !== userId || meta?.source === 'sync') return;
    if (edgeTimer) clearTimeout(edgeTimer);
    edgeTimer = setTimeout(() => {
      if (!disposed) pushEdgeModel(userId);
    }, PUSH_DEBOUNCE_MS);
  });

  const onOnline = () => {
    if (!disposed) hydrateAiSync(userId);
  };

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('online', onOnline);
  }

  return () => {
    disposed = true;
    if (sm2Timer) clearTimeout(sm2Timer);
    if (edgeTimer) clearTimeout(edgeTimer);
    unsubDeck();
    unsubEdge();
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('online', onOnline);
    }
  };
}
