import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from "../contexts/LanguageContext";
const ProductImage = ({ src, alt, priority = false, className = "" }) => {
    const [failedSrc, setFailedSrc] = useState(null);
    const unavailable = !src || failedSrc === src;
    const t = useTranslation();
    return (_jsx("div", { className: `product-card__media${className ? ` ${className}` : ""}${unavailable ? " product-card__media--fallback" : ""}`, children: unavailable ? (_jsxs("div", { className: "product-card__image-fallback", role: "img", "aria-label": `${alt}: ${t("imageUnavailable")}`, children: [_jsxs("svg", { viewBox: "0 0 48 48", "aria-hidden": "true", children: [_jsx("path", { d: "M24 39c0-14 6-24 18-30-1 16-6 26-18 30Z" }), _jsx("path", { d: "M24 39C23 27 17 20 7 17c1 12 6 19 17 22Z" }), _jsx("path", { d: "M24 40V24" })] }), _jsx("span", { children: t("imageUnavailable") })] })) : (_jsx("img", { src: src, alt: alt, loading: priority ? "eager" : "lazy", decoding: "async", onError: () => setFailedSrc(src) })) }));
};
export default ProductImage;
