import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "../contexts/LanguageContext";
const Footer = () => {
    const t = useTranslation();
    return (_jsx("footer", { children: _jsxs("div", { style: { display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }, children: [_jsxs("div", { children: [_jsx("strong", { children: "Vadhiyar Agrotech" }), _jsx("p", { children: t("footerTag") })] }), _jsxs("div", { children: [_jsx("p", { children: t("supportLine") }), _jsx("p", { children: "support@vadhiyaragrotech.com" })] })] }) }));
};
export default Footer;
