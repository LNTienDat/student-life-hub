import { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react';
import { clearDrafts } from '../services/drafts';
import { clearCache } from '../services/apiCache';
import { readSession, subscribeSessionChanges } from '../services/session';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return readSession(localStorage);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });

  useEffect(() => subscribeSessionChanges(localStorage, window, (session) => {
    clearCache();
    if (!session) clearDrafts(sessionStorage);
    setUser(session);
  }), []);

  const dangNhap = useCallback((userData, token) => {
    clearCache();
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const dangXuat = useCallback(() => {
    clearCache();
    clearDrafts(sessionStorage);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const capNhatUser = useCallback((userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const value = useMemo(() => ({
    user,
    dangNhap,
    dangXuat,
    capNhatUser
  }), [user, dangNhap, dangXuat, capNhatUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
