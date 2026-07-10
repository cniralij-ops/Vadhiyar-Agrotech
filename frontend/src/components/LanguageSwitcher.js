import { jsx as _jsx } from "react/jsx-runtime";
import { useLanguage } from "../contexts/LanguageContext";
const buttons = {
    en: "EN",
    hi: "HI",
    gu: "GU"
};
const LanguageSwitcher = () => {
    const { language, setLanguage } = useLanguage();
    return (_jsx("div", { className: "language-switcher", children: Object.entries(buttons).map(([code, label]) => (_jsx("button", { type: "button", className: language === code ? "active" : "", onClick: () => setLanguage(code), children: label }, code))) }));
};
export default LanguageSwitcher;
