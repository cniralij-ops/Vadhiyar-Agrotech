import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { useTranslation } from "../contexts/LanguageContext";
const ProductDetailPage = () => {
    const t = useTranslation();
    const { slug } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!slug)
            return;
        setLoading(true);
        api
            .get(`/api/products/${slug}`)
            .then(setProduct)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [slug]);
    if (loading) {
        return _jsx("p", { children: t("loading") });
    }
    if (!product) {
        return _jsx("p", { children: t("outOfStock") });
    }
    return (_jsx("section", { className: "form-card", children: _jsxs("div", { style: { display: "grid", gap: "1.2rem" }, children: [_jsx("img", { src: product.image, alt: product.name, style: { width: "100%", maxWidth: 420, borderRadius: 20, objectFit: "cover", aspectRatio: "4/3" } }), _jsxs("div", { children: [_jsx("h1", { children: product.name }), _jsxs("strong", { style: { fontSize: "1.75rem" }, children: ["\u20B9", product.price] }), _jsxs("div", { className: "catalogue-callout", style: { marginTop: "1rem" }, children: [_jsx("p", { children: t("catalogueMessage") }), _jsx("a", { href: "tel:9825213351", className: "button-primary", children: t("callNow") })] })] })] }) }));
};
export default ProductDetailPage;
