import { createContext, useContext, useEffect, useCallback } from 'react';
import { authApi } from '../api';
import { authSession } from '../utils/browserAuthSession';
import { watchAuthSession } from '../utils/authSession';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const user = authSession.getSession();
  useEffect(() => watchAuthSession(authSession, window, document), []);

  const login = useCallback(async (username, password) => {
    const { data } = await authApi.login(username, password);
    const userData = { username: data.username, name: data.name, role: data.role, token: data.accessToken };
    authSession.save(userData);
  }, []);

  const logout = useCallback(() => {
    authSession.clear();
  }, []);

  const value = { user, login, logout, isLoggedIn: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
