import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadUserFromStorage());
  const navigate = useNavigate();

  const login = useCallback(async (username, password) => {
    const { data } = await authApi.login(username, password);
    const userData = { username: data.username, role: data.role, token: data.accessToken };
    saveUserToStorage(userData);
    setUser(userData);
    navigate(userData.role.toUpperCase() === 'EXPERT' ? '/expert' : '/student', { replace: true });
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
    navigate('/');
  }, [navigate]);

  const value = { user, login, logout, isLoggedIn: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

function loadUserFromStorage() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  return {
    token,
    username: localStorage.getItem('username'),
    role: localStorage.getItem('role'),
  };
}

function saveUserToStorage({ token, username, role }) {
  localStorage.setItem('token', token);
  localStorage.setItem('username', username);
  localStorage.setItem('role', role);
}
