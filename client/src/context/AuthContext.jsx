import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('postly_token');
    if (token) {
      api.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('postly_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (name, email, password) => {
    const data = await api.register(name, email, password);
    localStorage.setItem('postly_token', data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('postly_token', data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.logout(); } catch (_) {}
    localStorage.removeItem('postly_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
