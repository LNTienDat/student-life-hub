import { clearCache } from './apiCache.js';
const eventName = 'slh:data-changed';
export function notifyDataChanged() {
  clearCache();
  window.dispatchEvent(new Event(eventName));
  try { localStorage.setItem(eventName, Date.now() + ':' + Math.random()); } catch { /* Private mode. */ }
}
export function subscribeDataChanges(refresh, { externalOnly = false } = {}) {
  const visible = () => { if (document.visibilityState === 'visible') refresh(); };
  const storage = event => { if (event.key === eventName) { clearCache(); if (document.visibilityState === 'visible') refresh(); } };
  if (!externalOnly) window.addEventListener(eventName, refresh);
  window.addEventListener('storage', storage);
  document.addEventListener('visibilitychange', visible);
  return () => {
    if (!externalOnly) window.removeEventListener(eventName, refresh);
    window.removeEventListener('storage', storage);
    document.removeEventListener('visibilitychange', visible);
  };
}
