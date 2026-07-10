import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { adminApi } from "../services/api";
const STORAGE_KEY = "vadhiyar-admin-auth";
const defaultState = { user: null, token: null };
const AuthContext = createContext({
    ...defaultState,
    isInitializing: false,
    login: async () => { },
    logout: () => { }
});
export const AdminAuthProvider = ({ children }) => {
    const [isInitializing, setIsInitializing] = useState(true);
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
    useEffect(() => {
        let isMounted = true;
        const validateSession = async () => {
            if (!state.token) {
                if (isMounted)
                    setIsInitializing(false);
                return;
            }
            try {
                const user = await adminApi.get("/api/auth/me", state.token);
                if (!isMounted)
                    return;
                if (user.role !== "ADMIN") {
                    setState(defaultState);
                }
                else {
                    setState((prev) => ({ ...prev, user }));
                }
            }
            catch (_error) {
                if (isMounted) {
                    setState(defaultState);
                }
            }
            finally {
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
    const login = async (credentials) => {
        const data = await adminApi.post("/api/auth/login", credentials, null);
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
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export const useAdminAuth = () => useContext(AuthContext);
