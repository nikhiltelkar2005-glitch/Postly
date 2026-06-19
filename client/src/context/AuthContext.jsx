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

  const sendOtp = async (email) => {
    await api.sendOtp(email);
  };

  const verifyOtp = async (email, otp) => {
    const data = await api.verifyOtp(email, otp);
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
    <AuthContext.Provider value={{ user, sendOtp, verifyOtp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
