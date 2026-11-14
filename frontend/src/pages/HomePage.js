import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../services/api";
import ProductCard from "../components/ProductCard";
import { useTranslation } from "../contexts/LanguageContext";
import farmHero from "../assets/farm-hero.jpg";
import { BUSINESS_INFO } from "../data/businessInfo";
const HomePage = () => {
    const t = useTranslation();
    const { hash } = useLocation();
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
    useEffect(() => {
        if (hash === "#about") {
            document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
        }
    }, [hash]);
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: "hero hero--landing", children: [_jsxs("div", { className: "hero__content", children: [_jsx("h1", { children: t("heroTagline") }), _jsx("p", { children: t("heroSubtitle") })] }), _jsx("div", { className: "hero__visual", children: _jsx("div", { className: "hero__circle", children: _jsx("img", { src: farmHero, alt: "Golden crops across a healthy farm at sunrise", className: "hero__photo", loading: "eager", decoding: "async" }) }) })] }), _jsxs("section", { style: { marginTop: "2.5rem" }, children: [_jsx("div", { className: "section-title", children: _jsx("h2", { children: t("products") }) }), _jsxs("div", { className: "catalogue-callout catalogue-callout--banner", children: [_jsx("p", { children: t("supportLine") }), _jsxs("a", { className: "catalogue-callout__phone", href: BUSINESS_INFO.phoneLink, children: [_jsx("span", { children: BUSINESS_INFO.phone }), _jsx("span", { children: t("callNow") })] })] }), loadError && _jsx("p", { style: { color: "#c0382b" }, children: loadError }), _jsx("div", { className: "card-grid", children: products.map((product) => (_jsx(ProductCard, { product: product }, product.id))) })] }), _jsxs("section", { className: "about-section", id: "about", "aria-labelledby": "about-title", children: [_jsxs("div", { className: "about-section__intro", children: [_jsx("span", { className: "products-eyebrow", children: t("aboutUs") }), _jsx("h2", { id: "about-title", children: BUSINESS_INFO.name }), _jsx("p", { children: t("aboutDescription") }), _jsxs("p", { className: "about-section__owner", children: [_jsx("strong", { children: BUSINESS_INFO.owner }), " \u00B7 ", t("proprietor")] }), _jsx("p", { className: "about-section__legal", lang: "gu", children: BUSINESS_INFO.legalNameGujarati }), _jsx("p", { className: "about-section__slogan", lang: "gu", children: BUSINESS_INFO.sloganGujarati })] }), _jsxs("div", { className: "about-section__details", children: [_jsx("h3", { children: t("services") }), _jsx("ul", { className: "about-section__services", children: BUSINESS_INFO.services.map((service) => _jsx("li", { children: service }, service)) }), _jsx("div", { className: "about-section__values", "aria-label": "Business values", children: BUSINESS_INFO.values.map((value) => _jsx("span", { className: "tag", children: value }, value)) })] })] })] }));
};
export default HomePage;
