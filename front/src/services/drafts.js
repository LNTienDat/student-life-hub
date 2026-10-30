const prefix='slh:draft:';
export function draftKey(userId,name) { return prefix+userId+':'+name; }
export function readDraft(storage,userId,name,fallback) {
  try {
    const raw=JSON.parse(storage.getItem(draftKey(userId,name))||'null');
    if(raw?.version===1&&raw.userId===userId&&Date.now()-raw.savedAt<7*86400000)return raw.value;
  }catch { /* Corrupt/unavailable storage should never prevent editing. */ }
  return typeof fallback==='function'?fallback():fallback;
}
export function saveDraft(storage,userId,name,value) {
  try {
    if(value===null)storage.removeItem(draftKey(userId,name));
    else storage.setItem(draftKey(userId,name),JSON.stringify({version:1,userId,savedAt:Date.now(),value}));
  }catch { /* Storage may be unavailable; the in-memory editor remains usable. */ }
}
export function clearDrafts(storage) {
  try { for(let i=storage.length-1;i>=0;i--){const key=storage.key(i);if(key?.startsWith(prefix))storage.removeItem(key);} }catch { /* Private mode. */ }
}
