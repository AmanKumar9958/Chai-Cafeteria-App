import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('adminAuth');
    setIsAuthenticated(saved === 'true');
  }, []);

  const login = async (username, password) => {
    const expectedUser = import.meta.env.VITE_ADMIN_USERNAME || 'admin@chaicafe2025';
    const expectedPass = import.meta.env.VITE_ADMIN_PASSWORD || 'chaicafeteria2025';
    if (username === expectedUser && password === expectedPass) {
      localStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      toast.success('Welcome, admin');
      return true;
    }
    toast.error('Invalid credentials');
    return false;
  };

  const logout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    toast('Logged out');
  };

  const value = useMemo(() => ({ isAuthenticated, login, logout }), [isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
