import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { useAuth } from "../contexts/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "../contexts/LanguageContext";
const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const t = useTranslation();
    return (_jsxs("header", { className: "header-bar", children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.8rem" }, children: [_jsx("img", { src: logo, alt: "Vadhiyar Agrotech", width: 48, height: 48 }), _jsxs("div", { children: [_jsx("strong", { style: { display: "block" }, children: "Vadhiyar Agrotech" }), _jsx("small", { style: { color: "var(--muted)" }, children: t("brandStatement") }), _jsx("small", { style: { color: "var(--muted)", display: "block", marginTop: 2 }, children: "\u0A98\u0AC0 \u0AB5\u0A9F\u0ABF\u0AAF\u0ABE\u0AB0 \u0A95\u0AC3\u0AB7\u0ABF \u0A89\u0AA4\u0ACD\u0AAA\u0ABE\u0AA6\u0AA8 \u0A85\u0AA8\u0AC7 \u0A96\u0AB0\u0AC0\u0AA6 \u0AB5\u0AC7\u0A9A\u0ABE\u0AA3 \u0AB8\u0AB9\u0A95\u0ABE\u0AB0\u0AC0 \u0AAE\u0A82\u0AA1\u0AB3\u0AC0 \u0AB2\u0ABF. \u0AB0\u0ABE\u0AA7\u0AA8\u0AAA\u0AC1\u0AB0" })] })] }), _jsxs("nav", { className: "nav-links", children: [_jsx(NavLink, { to: "/", className: ({ isActive }) => (isActive ? "nav-link active" : "nav-link"), children: t("home") }), _jsx(NavLink, { to: "/products", className: ({ isActive }) => (isActive ? "nav-link active" : "nav-link"), children: t("products") })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.75rem" }, children: [_jsx(LanguageSwitcher, {}), user ? (_jsx("button", { className: "button-primary", onClick: () => logout(), children: t("logout") })) : (_jsx("button", { className: "button-primary", onClick: () => navigate("/auth"), children: t("login") }))] })] }));
};
export default Header;
