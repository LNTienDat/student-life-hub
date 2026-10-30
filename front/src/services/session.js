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

export function subscribeSessionChanges(storage, target, onChange) {
  const sync = (event) => {
    // Login writes token first, user last. Wait for that commit before reading
    // the pair so another tab never redirects on a temporary ID mismatch.
    if (event.key === null || event.key === 'user'
      || (event.key === 'token' && event.newValue === null)) {
      onChange(readSession(storage));
    }
  };
  target.addEventListener('storage', sync);
  return () => target.removeEventListener('storage', sync);
}
