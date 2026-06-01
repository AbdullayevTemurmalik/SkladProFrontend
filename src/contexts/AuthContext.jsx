import { createContext, useState, useContext } from 'react';

import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });

  const login = async (username, password) => {
    try {
      const res = await api.post('/users/login', { username, password });
      if (res.data) {
        setIsAuthenticated(true);
        localStorage.setItem('isAdmin', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login xatosi:", error);
      return false;
    }
  };

  const register = async (username, password) => {
    try {
      const res = await api.post('/users', { username, password });
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
    localStorage.removeItem('isAdmin');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
