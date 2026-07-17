import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { getMe, login as loginRequest } from "../api/auth.api";
import { tokenStorage } from "../api/axiosClient";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    const token = tokenStorage.get();

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return null;
    }

    try {
      const data = await getMe();
      setUser(data.user);
      return data.user;
    } catch (error) {
      tokenStorage.clear();
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(async (email, password) => {
    const data = await loginRequest({ email, password });
    tokenStorage.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshUser: loadCurrentUser,
    }),
    [user, isLoading, login, logout, loadCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
