import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from './authApi';

const AuthContext = createContext(null);

const getStoredUser = () => {
  const username = localStorage.getItem('username');
  const roles = localStorage.getItem('roles');
  if (!username || !roles) return null;
  return {
    username,
    roles: JSON.parse(roles),
  };
};

const saveSession = ({ accessToken, refreshToken, username, roles }) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('username', username);
  localStorage.setItem('roles', JSON.stringify(roles));
};

const clearSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('username');
  localStorage.removeItem('roles');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [roles, setRoles] = useState(user?.roles || []);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        const profile = response.data?.data;
        setUser({ username: profile.username });
        setRoles(profile.roles || []);
      } catch (error) {
        clearSession();
        setUser(null);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (username, password) => {
    const response = await authApi.login({ username, password });
    const data = response.data?.data;
    saveSession(data);
    setUser({ username: data.username });
    setRoles(data.roles || []);
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Logout failed', error);
    }
    clearSession();
    setUser(null);
    setRoles([]);
    navigate('/login');
  };

  const value = useMemo(
    () => ({
      user,
      roles,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, roles, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
