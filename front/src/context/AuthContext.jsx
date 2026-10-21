import { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react';
import { clearCache } from '../services/apiCache';
import { readSession } from '../services/session';

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

  useEffect(() => {
    const sync = (event) => {
      if (event.key !== null && !['user', 'token'].includes(event.key)) return;
      clearCache();
      setUser(readSession(localStorage));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const dangNhap = useCallback((userData, token) => {
    clearCache();
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const dangXuat = useCallback(() => {
    clearCache();
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
