import React from "react";
import { useLanguage, Language } from "../contexts/LanguageContext";

const buttons: Record<Language, string> = {
  en: "EN",
  hi: "HI",
  gu: "GU"
};

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="language-switcher">
      {Object.entries(buttons).map(([code, label]) => (
        <button
          key={code}
          type="button"
          className={language === code ? "active" : ""}
          onClick={() => setLanguage(code as Language)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
