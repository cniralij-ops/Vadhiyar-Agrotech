import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
const defaultState = { user: null, token: null };
const AuthContext = createContext({
    ...defaultState,
    login: async () => { },
    loginAsOwner: async () => { throw new Error("Owner sign-in is unavailable."); },
    register: async () => { },
    loginWithOtp: async () => { },
    logout: () => { }
});
const STORAGE_KEY = "vadhiyar-auth";
export const AuthProvider = ({ children }) => {
    const [state, setState] = useState(() => {
        if (typeof window === "undefined")
            return defaultState;
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored)
            return defaultState;
        try {
            return JSON.parse(stored);
        }
        catch (error) {
            return defaultState;
        }
    });
    useEffect(() => {
        if (state.token) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
        else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    }, [state]);
    const login = async (payload) => {
        const data = await api.post("/api/auth/login", payload);
        setState({ user: data.user, token: data.token });
    };
    const loginAsOwner = async (payload) => {
        const data = await api.post("/api/auth/owner-login", payload);
        if (data.user.role !== "ADMIN") {
            throw new Error("This account is not authorized to manage products.");
        }
        setState({ user: data.user, token: data.token });
    };
    const register = async (payload) => {
        const data = await api.post("/api/auth/register", payload);
        setState({ user: data.user, token: data.token });
    };
    const loginWithOtp = async (payload) => {
        const data = await api.post("/api/auth/otp/complete", payload);
        setState({ user: data.user, token: data.token });
    };
    const logout = () => setState(defaultState);
    const value = useMemo(() => ({ ...state, login, loginAsOwner, logout, register, loginWithOtp }), [state]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export const useAuth = () => useContext(AuthContext);
