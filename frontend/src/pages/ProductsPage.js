import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { api } from "../services/api";
import { useTranslation } from "../contexts/LanguageContext";
const ProductsPage = () => {
    const t = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
    useEffect(() => {
        setLoading(true);
        setLoadError(null);
        const query = new URLSearchParams();
        if (searchTerm)
            query.set("search", searchTerm);
        api
            .get(`/api/products${query.toString() ? `?${query.toString()}` : ""}`)
            .then((data) => setProducts(data))
            .catch((error) => {
            console.error(error);
            setProducts([]);
            setLoadError("Unable to load products. Please check backend server and API URL.");
        })
            .finally(() => setLoading(false));
    }, [searchTerm]);
    const handleSearch = (event) => {
        event.preventDefault();
        setSearchParams((params) => {
            if (searchTerm) {
                params.set("search", searchTerm);
            }
            else {
                params.delete("search");
            }
            return params;
        });
    };
    const headerLabel = useMemo(() => {
        if (searchTerm) {
            return `${t("searchPlaceholder")} · ${searchTerm}`;
        }
        return t("products");
    }, [searchTerm, t]);
    return (_jsxs("section", { children: [_jsxs("div", { className: "section-title", style: { justifyContent: "space-between", flexWrap: "wrap" }, children: [_jsx("h2", { children: headerLabel }), _jsxs("form", { onSubmit: handleSearch, style: { display: "flex", gap: "0.5rem", flexWrap: "wrap" }, children: [_jsx("input", { type: "search", placeholder: t("searchPlaceholder"), value: searchTerm, onChange: (event) => setSearchTerm(event.target.value), style: { padding: "0.65rem 0.8rem", borderRadius: "12px", border: "1px solid var(--border)" } }), _jsx("button", { className: "button-primary", type: "submit", children: t("viewProducts") })] })] }), _jsxs("div", { className: "catalogue-callout catalogue-callout--banner", children: [_jsx("span", { className: "catalogue-callout__icon", children: "\uD83D\uDCDE" }), _jsx("strong", { children: "CALL ON: 9825213351" })] }), loading ? (_jsx("p", { children: t("loading") })) : loadError ? (_jsx("p", { style: { color: "#c0382b" }, children: loadError })) : products.length ? (_jsx("div", { className: "card-grid", children: products.map((product) => (_jsx(ProductCard, { product: product }, product.id))) })) : (_jsx("p", { children: t("noProducts") }))] }));
};
export default ProductsPage;
