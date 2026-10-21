export class BackendUnavailableError extends Error {
  constructor(offline = false) {
    super(offline
      ? 'Thiết bị đang mất mạng. Kết nối lại để tiếp tục.'
      : 'Chưa kết nối được máy chủ LifeHub. Hãy thử kết nối lại sau ít phút.');
    this.name = 'BackendUnavailableError';
    this.code = 'ERR_BACKEND_UNAVAILABLE';
  }
}

// Poll only while a real API request (or an explicit retry) is waiting.
// The probe is read-only; writes are never queued for automatic replay.
export function createBackendConnection({
  enabled = true, probe, online = () => true, now = () => Date.now(),
  delay = ms => new Promise(resolve => setTimeout(resolve, ms)),
  maxWaitMs = 90000, probeTimeoutMs = 10000, pollMs = 2000, freshMs = 60000,
  setTimer = setTimeout, clearTimer = clearTimeout,
} = {}) {
  let snapshot = Object.freeze({ status: 'idle' });
  let lastSuccess = null;
  let pending = null;
  const listeners = new Set();
  function publish(status) {
    if (snapshot.status === status) return;
    snapshot = Object.freeze({ status });
    listeners.forEach(listener => listener());
  }
  function confirmReady() { lastSuccess = now(); publish('ready'); }
  async function check(timeoutMs) {
    const controller = new AbortController();
    let timer;
    try {
      return await Promise.race([
        probe({ signal: controller.signal }),
        new Promise((_, reject) => { timer = setTimer(() => { controller.abort(); reject(new Error('Probe timed out')); }, timeoutMs); }),
      ]);
    } finally { clearTimer(timer); controller.abort(); }
  }
  async function connect() {
    const started = now();
    const notice = setTimer(() => publish('waking'), 800);
    try {
      while (now() - started < maxWaitMs) {
        if (!online()) throw new BackendUnavailableError(true);
        try {
          if (await check(Math.min(probeTimeoutMs, maxWaitMs - (now() - started)))) {
            confirmReady(); return;
          }
        } catch { /* Render can return HTML, gateway errors or a timed-out probe while waking. */ }
        publish('waking');
        const remaining = maxWaitMs - (now() - started);
        if (remaining > 0) await delay(Math.min(pollMs, remaining));
      }
      throw new BackendUnavailableError();
    } catch (error) {
      lastSuccess = null;
      publish(online() ? 'error' : 'offline');
      throw error;
    } finally { clearTimer(notice); }
  }
  function ensureReady(force = false) {
    if (!enabled) return Promise.resolve();
    if (pending) return pending;
    if (!online()) { publish('offline'); return Promise.reject(new BackendUnavailableError(true)); }
    if (!force && lastSuccess !== null && now() - lastSuccess < freshMs) return Promise.resolve();
    pending = connect().finally(() => { pending = null; });
    return pending;
  }
  return {
    enabled, ensureReady, confirmReady,
    retry: () => ensureReady(true),
    markUnavailable: () => { lastSuccess = null; publish(online() ? 'error' : 'offline'); },
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
