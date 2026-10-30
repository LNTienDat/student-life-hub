import { normalizeSemester } from '../utils/semester';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const SemesterContext = createContext(null);
export function SemesterProvider({ children }) {
  const { user, capNhatUser } = useAuth();
  const currentSemester = normalizeSemester(user.hocKyHienTai);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    api.get('/auth/ho-so').then(({ data }) => {
      if (!active) return;
      if (data.user?.id !== user.id) throw new Error('Invalid profile response');
      const current = data.user?.hocKyHienTai || '';
      setError('');
      if (data.user?.id === user.id) capNhatUser(data.user);
      try {
        const key = `slh:semester:${user.id}`;
        if (current && localStorage.getItem(key) === null) {
          localStorage.setItem(key, current); window.dispatchEvent(new Event('slh:semester'));
        }
      } catch { /* Selection still applies to new entries without browser storage. */ }
    }).catch(() => { if (active) setError('Chưa tải được học kỳ đang học.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.id, capNhatUser, retry]);
  async function saveCurrentSemester(name) {
    const value = normalizeSemester(name);
    if (!value || value.length > 100) throw new Error('Tên học kỳ cần 1–100 ký tự.');
    if (loading || lock.current) return false;
    lock.current = true; setSaving(true); setError('');
    try {
      const { data } = await api.put('/auth/ho-so', { hocKyHienTai: value });
      if (data.user?.id !== user.id || data.user.hocKyHienTai !== value) throw new Error('Chưa xác nhận được học kỳ đã lưu.');
      capNhatUser(data.user);
      try {
        localStorage.setItem(`slh:semester:${user.id}`, data.user.hocKyHienTai);
        window.dispatchEvent(new Event('slh:semester'));
      } catch { /* The account preference remains saved on the server. */ }
      return true;
    } finally { lock.current = false; setSaving(false); }
  }
  function applyDeletedSemester(deleted,current,history) {
    capNhatUser({...user,hocKyHienTai:normalizeSemester(current),hocKyDaLuu:history||(user.hocKyDaLuu||[]).filter(item=>normalizeSemester(item)!==deleted)});
    try{const key=`slh:semester:${user.id}`;if(normalizeSemester(localStorage.getItem(key))===deleted)localStorage.setItem(key,'');window.dispatchEvent(new Event('slh:semester'));}catch{/* Account remains updated even if storage is blocked. */}
  }
  return <SemesterContext.Provider value={{ currentSemester, loading, saving, error, retry: () => { setLoading(true); setRetry(value => value + 1); }, saveCurrentSemester, applyDeletedSemester }}>{children}</SemesterContext.Provider>;
}
export function useCurrentSemester() {
  return useContext(SemesterContext);
}
