import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from './authApi';

const AuthContext = createContext(null);

const getStoredUser = () => {
  const username = localStorage.getItem('username');
  const roles = localStorage.getItem('roles');
  if (!username || !roles) return null;
  try {
    return {
      username,
      roles: JSON.parse(roles),
    };
  } catch {
    return null;
  }
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
  const storedUser = getStoredUser();
  const [user, setUser] = useState(storedUser ? { username: storedUser.username } : null);
  const [roles, setRoles] = useState(storedUser?.roles || []);
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
        if (profile) {
          setUser({ username: profile.username });
          setRoles(profile.roles || []);
          // Cập nhật lại localStorage với roles mới nhất từ server
          localStorage.setItem('username', profile.username);
          localStorage.setItem('roles', JSON.stringify(profile.roles || []));
        }
      } catch (error) {
        // Chỉ xóa session khi server xác nhận token không hợp lệ (401/403)
        // Không xóa khi lỗi mạng (network error) để tránh đăng xuất oan
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          clearSession();
          setUser(null);
          setRoles([]);
        }
        // Nếu lỗi mạng (không có status): giữ nguyên state từ localStorage
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
