import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { adminApi } from "../services/api";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
}

type AuthState = {
  user: AdminUser | null;
  token: string | null;
};




interface AuthContextValue extends AuthState {
  isInitializing: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = "vadhiyar-admin-auth";

const defaultState: AuthState = { user: null, token: null };

const AuthContext = createContext<AuthContextValue>({
  ...defaultState,
  isInitializing: false,
  login: async () => {},
  logout: () => {}
});

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [state, setState] = useState<AuthState>(() => {
    if (typeof window === "undefined") return defaultState;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState;
    try {
      return JSON.parse(stored) as AuthState;
    } catch (error) {
      return defaultState;
    }
  });

  useEffect(() => {
    if (state.token) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [state]);

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      if (!state.token) {
        if (isMounted) setIsInitializing(false);
        return;
      }

      try {
        const user = await adminApi.get<AdminUser>("/api/auth/me", state.token);
        if (!isMounted) return;
        if (user.role !== "ADMIN") {
          setState(defaultState);
        } else {
          setState((prev) => ({ ...prev, user }));
        }
      } catch (_error) {
        if (isMounted) {
          setState(defaultState);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    validateSession();

    return () => {
      isMounted = false;
    };
  }, [state.token]);

  const login = async (credentials: { email: string; password: string }) => {
    const data = await adminApi.post<{ token: string; user: AdminUser }>("/api/auth/login", credentials, null);
    if (data.user.role !== "ADMIN") {
      throw new Error("Admin access required");
    }
    setState({ token: data.token, user: data.user });
  };

  const logout = () => {
    setState(defaultState);
    setIsInitializing(false);
  };

  const value = useMemo(() => ({ ...state, isInitializing, login, logout }), [state, isInitializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAdminAuth = () => useContext(AuthContext);
