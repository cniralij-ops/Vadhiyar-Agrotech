import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { useAuth } from "../contexts/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "../contexts/LanguageContext";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const t = useTranslation();

  return (
    <header className="header-bar">
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
        <img src={logo} alt="Vadhiyar Agrotech" width={48} height={48} />
        <div>
          <strong style={{ display: "block" }}>Vadhiyar Agrotech</strong>
          <small style={{ color: "var(--muted)" }}>{t("brandStatement")}</small>
          <small style={{ color: "var(--muted)", display: "block", marginTop: 2 }}>
            ઘી વટિયાર કૃષિ ઉત્પાદન અને ખરીદ વેચાણ સહકારી મંડળી લિ. રાધનપુર
          </small>
        </div>
      </div>
      <nav className="nav-links">
        <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          {t("home")}
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          {t("products")}
        </NavLink>
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
