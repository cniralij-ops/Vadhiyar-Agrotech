import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/vadhiyar-logo.jpeg";
import { useAuth } from "../contexts/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "../contexts/LanguageContext";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const t = useTranslation();

  return (
    <header className="header-bar">
      <Link to="/" className="header-brand">
        <img src={logo} alt="" width={44} height={44} />
        <strong>Vadhiyar Agrotech</strong>
      </Link>
      <nav className="nav-links" aria-label="Main navigation">
        <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          {t("home")}
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          {t("products")}
        </NavLink>
        <NavLink to="/#about" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          {t("aboutUs")}
        </NavLink>
        <NavLink to="/contact" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          {t("contactUs")}
        </NavLink>
      </nav>
      <div className="header-actions">
        <LanguageSwitcher />
        {user ? (
          <button className="button-primary" onClick={() => logout()}>
            {t("logout")}
          </button>
        ) : (
          <button className="button-primary" onClick={() => navigate("/auth")}>{t("login")}</button>
        )}
      </div>
    </header>
  );
};

export default Header;

