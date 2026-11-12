import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { api } from "../services/api";
import { useTranslation } from "../contexts/LanguageContext";
import { BUSINESS_INFO } from "../data/businessInfo";
const ProductsPage = () => {
    const t = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
    const appliedSearch = searchParams.get("search") ?? "";
    useEffect(() => {
        setSearchTerm(appliedSearch);
    }, [appliedSearch]);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setLoadError(null);
        const query = new URLSearchParams();
        if (appliedSearch)
            query.set("search", appliedSearch);
        api
            .get(`/api/products${query.toString() ? `?${query.toString()}` : ""}`)
            .then((data) => {
            if (active)
                setProducts(data);
        })
            .catch((error) => {
            if (!active)
                return;
            console.error(error);
            setProducts([]);
            setLoadError("Unable to load products. Please check backend server and API URL.");
        })
            .finally(() => {
            if (active)
                setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [appliedSearch]);
    const handleSearch = (event) => {
        event.preventDefault();
        const normalizedSearch = searchTerm.trim();
        setSearchParams((params) => {
            if (normalizedSearch) {
                params.set("search", normalizedSearch);
            }
            else {
                params.delete("search");
            }
            return params;
        });
    };
    return (_jsxs("section", { className: "products-page", children: [_jsxs("div", { className: "products-intro", children: [_jsxs("div", { className: "products-intro__copy", children: [_jsx("span", { className: "products-eyebrow", children: t("brandStatement") }), _jsx("h1", { children: appliedSearch ? `${t("searchPlaceholder")}: ${appliedSearch}` : t("products") }), _jsx("p", { children: t("catalogueIntro") })] }), _jsxs("form", { className: "product-search", onSubmit: handleSearch, role: "search", children: [_jsx("input", { type: "search", placeholder: t("searchPlaceholder"), "aria-label": t("searchPlaceholder"), value: searchTerm, onChange: (event) => setSearchTerm(event.target.value) }), _jsx("button", { className: "button-primary", type: "submit", children: t("viewProducts") })] })] }), _jsxs("div", { className: "catalogue-callout catalogue-callout--banner", children: [_jsx("p", { children: t("supportLine") }), _jsxs("a", { className: "catalogue-callout__phone", href: BUSINESS_INFO.phoneLink, children: [_jsx("span", { children: BUSINESS_INFO.phone }), _jsx("span", { children: t("callNow") })] })] }), loading ? (_jsx("div", { className: "product-skeleton-grid", role: "status", "aria-label": t("loading"), children: Array.from({ length: 6 }, (_, index) => (_jsxs("div", { className: "product-skeleton", children: [_jsx("span", { className: "product-skeleton__image" }), _jsx("span", { className: "product-skeleton__line" }), _jsx("span", { className: "product-skeleton__line product-skeleton__line--short" })] }, index))) })) : loadError ? (_jsx("p", { className: "products-error", role: "alert", children: loadError })) : products.length ? (_jsx("div", { className: "card-grid", children: products.map((product, index) => (_jsx(ProductCard, { product: product, priority: index < 4 }, product.id))) })) : (_jsx("p", { className: "products-empty", children: t("noProducts") }))] }));
};
export default ProductsPage;
