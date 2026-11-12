import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useTranslation } from "../contexts/LanguageContext";
import { BUSINESS_INFO } from "../data/businessInfo";
const Footer = () => {
    const t = useTranslation();
    return (_jsx("footer", { className: "site-footer", children: _jsxs("div", { className: "site-footer__inner", children: [_jsxs("div", { className: "site-footer__brand", children: [_jsx("strong", { children: BUSINESS_INFO.name }), _jsx("p", { children: t("footerTag") }), _jsx("p", { lang: "gu", children: BUSINESS_INFO.legalNameGujarati })] }), _jsxs("div", { className: "site-footer__contact", children: [_jsx("p", { children: t("supportLine") }), _jsx("a", { href: BUSINESS_INFO.phoneLink, children: BUSINESS_INFO.phone }), _jsx("a", { href: `mailto:${BUSINESS_INFO.email}`, children: BUSINESS_INFO.email }), _jsx("p", { children: BUSINESS_INFO.address })] }), _jsxs("div", { className: "site-footer__links", children: [_jsx(Link, { to: "/contact", children: t("contactUs") }), _jsx(Link, { to: "/owner", children: t("ownerLogin") })] })] }) }));
};
export default Footer;
