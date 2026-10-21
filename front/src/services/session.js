export function readSession(storage, now = Date.now()) {
  try {
    const token = storage.getItem('token');
    const user = JSON.parse(storage.getItem('user') || 'null');
    if (!token || !user || !Number.isSafeInteger(user.id) || user.id <= 0) return null;
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!Number.isFinite(payload.exp) || payload.exp * 1000 <= now || payload.id !== user.id) return null;
    return user;
  } catch { return null; }
}
