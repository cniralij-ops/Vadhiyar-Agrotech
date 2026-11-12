import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { useTranslation } from "../contexts/LanguageContext";
import ProductImage from "../components/ProductImage";
import { BUSINESS_INFO } from "../data/businessInfo";
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
    return (_jsx("section", { className: "form-card", children: _jsxs("div", { style: { display: "grid", gap: "1.2rem" }, children: [_jsx(ProductImage, { src: product.image, alt: product.name, priority: true, className: "product-image--detail" }), _jsxs("div", { children: [_jsx("h1", { children: product.name }), _jsxs("strong", { style: { fontSize: "1.75rem" }, children: ["\u20B9", product.price.toLocaleString("en-IN")] }), _jsx("p", { className: product.isAvailable && product.stock > 0 ? "product-availability" : "product-availability product-availability--out", children: product.isAvailable && product.stock > 0 ? t("inStock") : t("outOfStock") }), _jsxs("div", { className: "catalogue-callout", style: { marginTop: "1rem" }, children: [_jsx("p", { children: t("catalogueMessage") }), _jsx("a", { href: BUSINESS_INFO.phoneLink, className: "button-primary", children: t("callNow") })] })] })] }) }));
};
export default ProductDetailPage;
