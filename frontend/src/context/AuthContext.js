import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearAuthSession,
  getCurrentUser,
  getStoredToken,
  getStoredUser,
  loginUser,
  storeAuthSession,
} from '../services/api';

const AuthContext = createContext(null);

export const getDefaultRouteForUser = (user) =>
  user?.role === 'Admin' ? '/admin/dashboard' : '/admin/issues';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(getStoredToken()));

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      if (!token) {
        if (isMounted) {
          setIsBootstrapping(false);
        }
        return;
      }

      try {
        const response = await getCurrentUser();

        if (!isMounted) {
          return;
        }

        setUser(response.user);
        storeAuthSession(token, response.user);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        clearAuthSession();
        setToken('');
        setUser(null);
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (credentials) => {
    const response = await loginUser(credentials);
    storeAuthSession(response.token, response.user);
    setToken(response.token);
    setUser(response.user);
    setIsBootstrapping(false);
    return response.user;
  };

  const logout = () => {
    clearAuthSession();
    setToken('');
    setUser(null);
    setIsBootstrapping(false);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      isBootstrapping,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'Admin',
    }),
    [isBootstrapping, token, user]
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
