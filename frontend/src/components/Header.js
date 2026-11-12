import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/vadhiyar-logo.jpeg";
import { useAuth } from "../contexts/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "../contexts/LanguageContext";
const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const t = useTranslation();
    return (_jsxs("header", { className: "header-bar", children: [_jsxs(Link, { to: "/", className: "header-brand", children: [_jsx("img", { src: logo, alt: "", width: 44, height: 44 }), _jsx("strong", { children: "Vadhiyar Agrotech" })] }), _jsxs("nav", { className: "nav-links", "aria-label": "Main navigation", children: [_jsx(NavLink, { to: "/", className: ({ isActive }) => (isActive ? "nav-link active" : "nav-link"), children: t("home") }), _jsx(NavLink, { to: "/products", className: ({ isActive }) => (isActive ? "nav-link active" : "nav-link"), children: t("products") }), _jsx(NavLink, { to: "/#about", className: ({ isActive }) => (isActive ? "nav-link active" : "nav-link"), children: t("aboutUs") }), _jsx(NavLink, { to: "/contact", className: ({ isActive }) => (isActive ? "nav-link active" : "nav-link"), children: t("contactUs") })] }), _jsxs("div", { className: "header-actions", children: [_jsx(LanguageSwitcher, {}), user ? (_jsx("button", { className: "button-primary", onClick: () => logout(), children: t("logout") })) : (_jsx("button", { className: "button-primary", onClick: () => navigate("/auth"), children: t("login") }))] })] }));
};
export default Header;
