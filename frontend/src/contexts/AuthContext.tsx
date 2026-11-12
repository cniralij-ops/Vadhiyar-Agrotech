import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  phone?: string;
  isOwner?: boolean;
}

type AuthState = {
  user: AuthUser | null;
  token: string | null;
};

type LoginPayload = { name: string; email?: string; phone?: string };
type RegisterPayload = {
  name: string;
  phone: string;
  email?: string;
  addressLine: string;
  city: string;
  state: string;
  otpToken: string;
};
type OtpCompletePayload = { token: string; phone: string; code: string; name?: string; addressLine?: string; city?: string; state?: string };

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  loginAsOwner: (payload: { password: string }) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginWithOtp: (payload: OtpCompletePayload) => Promise<void>;
  logout: () => void;
}

const defaultState: AuthState = { user: null, token: null };

const AuthContext = createContext<AuthContextValue>({
  ...defaultState,
  login: async () => {},
  loginAsOwner: async () => { throw new Error("Owner sign-in is unavailable."); },
  register: async () => {},
  loginWithOtp: async () => {},
  logout: () => {}
});

const STORAGE_KEY = "vadhiyar-auth";

type AuthPayload = { token: string; user: AuthUser };

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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

  const login = async (payload: LoginPayload) => {
    const data = await api.post<AuthPayload>("/api/auth/login", payload);
    setState({ user: data.user, token: data.token });
  };

  const loginAsOwner = async (payload: { password: string }) => {
    const data = await api.post<AuthPayload>("/api/auth/owner-login", payload);
    if (data.user.role !== "ADMIN") {
      throw new Error("This account is not authorized to manage products.");
    }
    setState({ user: data.user, token: data.token });
  };

  const register = async (payload: RegisterPayload) => {
    const data = await api.post<AuthPayload>("/api/auth/register", payload);
    setState({ user: data.user, token: data.token });
  };

  const loginWithOtp = async (payload: OtpCompletePayload) => {
    const data = await api.post<AuthPayload>("/api/auth/otp/complete", payload);
    setState({ user: data.user, token: data.token });
  };

  const logout = () => setState(defaultState);

  const value = useMemo(() => ({ ...state, login, loginAsOwner, logout, register, loginWithOtp }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

