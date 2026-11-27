import { DANH_MUC_CHI, DANH_MUC_THU, TEN_DANH_MUC } from '../constants.js';
import {
  createEdgeModel,
  extractAmountFeatures,
  extractDueFeatures,
  extractTextFeatures,
} from '../utils/edgeClassifier.js';

const STORAGE_PREFIX = 'slh:edge_ai:v1:';
const listeners = new Set();

export function edgeStorageKey(userId) {
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
    // Storage disabled (e.g., private browsing or restricted iframe).
  }
  return null;
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

export function subscribeEdgeAi(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function loadModel(userId, explicitStorage) {
  const store = resolveStorage(explicitStorage);
  if (!store || !isValidUserId(userId)) {
    return { model: createEdgeModel(null), rawLength: 0, store };
  }
  try {
    const raw = store.getItem(edgeStorageKey(userId));
    if (!raw) return { model: createEdgeModel(null), rawLength: 0, store };
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || parsed?.userId !== userId) {
      return { model: createEdgeModel(null), rawLength: 0, store };
    }
    const rawLength = typeof TextEncoder !== 'undefined'
      ? new TextEncoder().encode(raw).length
      : raw.length;
    return { model: createEdgeModel(parsed), rawLength, store };
  } catch {
    return { model: createEdgeModel(null), rawLength: 0, store };
  }
}

function saveModel(userId, model, store) {
  if (!store || !isValidUserId(userId)) return false;
  try {
    store.setItem(edgeStorageKey(userId), JSON.stringify(model.serialize(userId)));
    return true;
  } catch {
    // QuotaExceededError or security error: fail safely without breaking forms.
    return false;
  }
}

export function predictFinanceCategory({
  userId = null,
  text = '',
  amount = null,
  loai = 'chi',
  categories = [],
  storage = null,
} = {}) {
  const cleanLoai = loai === 'thu' ? 'thu' : 'chi';
  const task = cleanLoai === 'thu' ? 'finance_thu' : 'finance_chi';
  const activeCategories = Array.isArray(categories)
    ? categories.filter((c) => c && c.loai === cleanLoai && !c.daAn && c.ma)
    : [];

  let allowedLabels;
  const labelDisplayNames = {};

  if (activeCategories.length > 0) {
    allowedLabels = activeCategories.map((c) => c.ma);
    for (const c of activeCategories) {
      if (c.ten) labelDisplayNames[c.ma] = c.ten;
    }
  } else {
    allowedLabels = cleanLoai === 'thu' ? DANH_MUC_THU : DANH_MUC_CHI;
    for (const code of allowedLabels) {
      if (TEN_DANH_MUC[code]) labelDisplayNames[code] = TEN_DANH_MUC[code];
    }
  }

  const features = [
    ...extractTextFeatures(text),
    ...extractAmountFeatures(amount),
  ];
  if (!features.length) return null;

  const { model } = loadModel(userId, storage);
  return model.predict(task, features, { allowedLabels, labelDisplayNames });
}

export function trainFinanceSample({
  userId = null,
  loai = 'chi',
  danhMuc = '',
  moTa = '',
  soTien = null,
  sampleId = null,
  wasPredictedLabel = null,
  weight = 2,
  storage = null,
} = {}) {
  const cleanLabel = String(danhMuc || '').trim();
  const features = [
    ...extractTextFeatures(moTa),
    ...extractAmountFeatures(soTien),
  ];
  if (!cleanLabel || !features.length) return false;

  const task = loai === 'thu' ? 'finance_thu' : 'finance_chi';
  const { model, store } = loadModel(userId, storage);
  const changed = model.train(task, cleanLabel, features, {
    weight,
    sampleId,
    wasPredictedLabel,
  });

  if (changed) {
    saveModel(userId, model, store);
    notifyListeners(userId);
  }
  return changed;
}

export function syncFinanceHistory(userId, transactions = [], storage = null) {
  if (!isValidUserId(userId) || !Array.isArray(transactions) || !transactions.length) return 0;
  const { model, store } = loadModel(userId, storage);
  let added = 0;

  for (const tx of transactions) {
    if (!tx || !tx.id || !tx.danhMuc || !String(tx.moTa || '').trim()) continue;
    const features = [
      ...extractTextFeatures(tx.moTa),
      ...extractAmountFeatures(tx.soTien),
    ];
    if (!features.length) continue;
    const task = tx.loai === 'thu' ? 'finance_thu' : 'finance_chi';
    if (model.train(task, tx.danhMuc, features, { sampleId: `tx:${tx.id}`, weight: 1 })) {
      added++;
    }
  }

  if (added > 0) {
    saveModel(userId, model, store);
    notifyListeners(userId);
  }
  return added;
}

export function predictDeadlinePriority({
  userId = null,
  title = '',
  hanChot = '',
  now = Date.now(),
  storage = null,
} = {}) {
  const features = [
    ...extractTextFeatures(title),
    ...extractDueFeatures(hanChot, now),
  ];
  if (!features.length) return null;

  const { model } = loadModel(userId, storage);
  return model.predict('deadline_priority', features, {
    allowedLabels: ['cao', 'binh_thuong', 'thap'],
    labelDisplayNames: {
      cao: 'Khẩn cấp',
      binh_thuong: 'Bình thường',
      thap: 'Thấp',
    },
  });
}

export function trainDeadlineSample({
  userId = null,
  tieuDe = '',
  hanChot = '',
  doUuTien = '',
  sampleId = null,
  wasPredictedLabel = null,
  weight = 2,
  now = Date.now(),
  storage = null,
} = {}) {
  const cleanLabel = String(doUuTien || '').trim();
  const features = [
    ...extractTextFeatures(tieuDe),
    ...extractDueFeatures(hanChot, now),
  ];
  if (!cleanLabel || !features.length) return false;

  const { model, store } = loadModel(userId, storage);
  const changed = model.train('deadline_priority', cleanLabel, features, {
    weight,
    sampleId,
    wasPredictedLabel,
  });

  if (changed) {
    saveModel(userId, model, store);
    notifyListeners(userId);
  }
  return changed;
}

export function syncDeadlineHistory(userId, deadlines = [], storage = null) {
  if (!isValidUserId(userId) || !Array.isArray(deadlines) || !deadlines.length) return 0;
  const { model, store } = loadModel(userId, storage);
  let added = 0;

  for (const dl of deadlines) {
    if (!dl || !dl.id || !dl.doUuTien || !String(dl.tieuDe || '').trim()) continue;
    const features = [
      ...extractTextFeatures(dl.tieuDe),
      ...extractDueFeatures(dl.hanChot),
    ];
    if (!features.length) continue;
    if (model.train('deadline_priority', dl.doUuTien, features, { sampleId: `dl:${dl.id}`, weight: 1 })) {
      added++;
    }
  }

  if (added > 0) {
    saveModel(userId, model, store);
    notifyListeners(userId);
  }
  return added;
}

export function getEdgeAiStats(userId, storage = null) {
  const { model, rawLength } = loadModel(userId, storage);
  return {
    ...model.getStats(),
    storageBytes: rawLength,
  };
}

export function resetEdgeAiModel(userId, task = null, storage = null) {
  const store = resolveStorage(storage);
  if (!store || !isValidUserId(userId)) return false;

  try {
    if (task) {
      const { model } = loadModel(userId, store);
      model.reset(task);
      saveModel(userId, model, store);
    } else if (typeof store.removeItem === 'function') {
      store.removeItem(edgeStorageKey(userId));
    } else {
      saveModel(userId, createEdgeModel(null), store);
    }
    notifyListeners(userId);
    return true;
  } catch {
    return false;
  }
}

const EDGE_TASKS = ['finance_chi', 'finance_thu', 'deadline_priority'];

function compareTaskRichness(taskA, taskB) {
  const diffSamples = (taskA?.userSamples || 0) - (taskB?.userSamples || 0);
  if (diffSamples !== 0) return diffSamples;
  const diffFeedback = (taskA?.feedbackTotal || 0) - (taskB?.feedbackTotal || 0);
  if (diffFeedback !== 0) return diffFeedback;
  const diffSeen = (taskA?.seenIds?.length || 0) - (taskB?.seenIds?.length || 0);
  if (diffSeen !== 0) return diffSeen;
  return Object.keys(taskA?.tokenCounts || {}).length - Object.keys(taskB?.tokenCounts || {}).length;
}

export function exportEdgeModel(userId, storage = null) {
  if (!isValidUserId(userId)) return null;
  const { model } = loadModel(userId, storage);
  const stats = model.getStats();
  if (stats.totalSamples === 0 && stats.vocabSize === 0) return null;
  return model.serialize(userId);
}

export function mergeEdgeModels(localSerialized, remoteSerialized, userId) {
  const validLocal = Boolean(localSerialized && localSerialized.version === 1 && localSerialized.tasks);
  const localNorm = createEdgeModel(validLocal ? localSerialized : null).serialize(userId);
  const validRemote = Boolean(
    remoteSerialized
    && remoteSerialized.version === 1
    && remoteSerialized.tasks
    && typeof remoteSerialized.tasks === 'object',
  );

  if (!validRemote) {
    const hasLocalSamples = EDGE_TASKS.some(
      (task) => (localNorm.tasks[task]?.userSamples || 0) > 0 || Object.keys(localNorm.tasks[task]?.tokenCounts || {}).length > 0,
    );
    return {
      model: localNorm,
      changedLocal: false,
      needsPush: hasLocalSamples,
    };
  }

  const remoteNorm = createEdgeModel(remoteSerialized).serialize(userId);
  const localUpdated = Number.isFinite(localSerialized?.updatedAt) ? localSerialized.updatedAt : 0;
  const remoteUpdated = Number.isFinite(remoteSerialized?.updatedAt) ? remoteSerialized.updatedAt : 0;

  const mergedTasks = {};
  let changedLocal = false;
  let needsPush = false;

  for (const task of EDGE_TASKS) {
    const lTask = localNorm.tasks[task];
    const rTask = remoteNorm.tasks[task];
    const cmp = compareTaskRichness(rTask, lTask);
    if (cmp > 0 || (cmp === 0 && remoteUpdated > localUpdated && (rTask?.userSamples || 0) > 0)) {
      mergedTasks[task] = rTask;
      changedLocal = true;
    } else if (cmp < 0) {
      mergedTasks[task] = lTask;
      needsPush = true;
    } else {
      mergedTasks[task] = lTask;
    }
  }

  const model = createEdgeModel({
    version: 1,
    userId: isValidUserId(userId) ? userId : null,
    tasks: mergedTasks,
  }).serialize(isValidUserId(userId) ? userId : null);

  return {
    model,
    changedLocal,
    needsPush,
  };
}

export function replaceEdgeModelFromSync(userId, serialized, storage = null) {
  const store = resolveStorage(storage);
  if (!store || !isValidUserId(userId) || !serialized || typeof serialized !== 'object') return false;
  try {
    const model = createEdgeModel(serialized);
    const ok = saveModel(userId, model, store);
    if (ok) notifyListeners(userId, { source: 'sync' });
    return ok;
  } catch {
    return false;
  }
}
