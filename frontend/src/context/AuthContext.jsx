import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tf_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tf_token');
    if (token) {
      auth.me().then(r => {
        setUser(r.data.user);
        localStorage.setItem('tf_user', JSON.stringify(r.data.user));
      }).catch(() => {
        localStorage.removeItem('tf_token');
        localStorage.removeItem('tf_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await auth.login({ email, password });
    localStorage.setItem('tf_token', r.data.token);
    localStorage.setItem('tf_user', JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const signup = async (name, email, password) => {
    const r = await auth.signup({ name, email, password });
    localStorage.setItem('tf_token', r.data.token);
    localStorage.setItem('tf_user', JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
