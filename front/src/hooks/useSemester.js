import { useCallback, useSyncExternalStore } from 'react';
import { useAuth } from '../context/AuthContext';

function subscribe(callback) {
  window.addEventListener('slh:semester', callback);
  window.addEventListener('storage', callback);
  return () => { window.removeEventListener('slh:semester', callback); window.removeEventListener('storage', callback); };
}
export function useSemester() {
  const { user } = useAuth();
  const key = `slh:semester:${user?.id}`;
  const getSnapshot = useCallback(() => localStorage.getItem(key) || '', [key]);
  const semester = useSyncExternalStore(subscribe, getSnapshot);
  const setSemester = useCallback((value) => {
    localStorage.setItem(key, value.trim());
    window.dispatchEvent(new Event('slh:semester'));
  }, [key]);
  return [semester, setSemester];
}
