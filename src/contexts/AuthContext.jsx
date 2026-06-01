import { createContext, useState, useContext } from 'react';

import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });

  const login = async (username, password) => {
    try {
      const res = await api.post('/users/login', { username, password });
      if (res.data) {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        if (username === 'admin') {
          setIsAdmin(true);
          localStorage.setItem('isAdmin', 'true');
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login xatosi:", error);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/users', userData);
      if (res.data) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Register xatosi:", error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('isAdmin');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
