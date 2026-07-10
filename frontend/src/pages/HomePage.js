import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import ProductCard from "../components/ProductCard";
import { useTranslation } from "../contexts/LanguageContext";
import brandLogo from "../assets/logo.svg";
const HomePage = () => {
    const t = useTranslation();
    const [products, setProducts] = useState([]);
    const [loadError, setLoadError] = useState(null);
    useEffect(() => {
        api
            .get("/api/products")
            .then((data) => setProducts(data))
            .catch((error) => {
            console.error(error);
            setLoadError("Unable to load products. Start backend on port 4000.");
        });
    }, []);
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: "hero hero--landing", children: [_jsxs("div", { className: "hero__content", children: [_jsx("h1", { children: t("heroTagline") }), _jsx("p", { children: t("heroSubtitle") })] }), _jsx("div", { className: "hero__visual", children: _jsx("div", { className: "hero__circle", children: _jsx("img", { src: brandLogo, alt: "Vadhiyar Agrotech logo", className: "hero__logo", loading: "lazy" }) }) })] }), _jsxs("section", { style: { marginTop: "2.5rem" }, children: [_jsx("div", { className: "section-title", children: _jsx("h2", { children: t("products") }) }), _jsxs("div", { className: "catalogue-callout catalogue-callout--banner", children: [_jsx("span", { className: "catalogue-callout__icon", children: "\uD83D\uDCDE" }), _jsx("strong", { children: "CALL ON: 9825213351" })] }), loadError && _jsx("p", { style: { color: "#c0382b" }, children: loadError }), _jsx("div", { className: "card-grid", children: products.map((product) => (_jsx(ProductCard, { product: product }, product.id))) })] })] }));
};
export default HomePage;
