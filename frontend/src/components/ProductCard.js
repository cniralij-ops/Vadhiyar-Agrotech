import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import ProductImage from "./ProductImage";
import { useTranslation } from "../contexts/LanguageContext";
const ProductCard = ({ product, priority = false }) => {
    const t = useTranslation();
    return (_jsxs(Link, { to: `/products/${product.slug}`, className: "product-card product-card--catalogue", children: [_jsx(ProductImage, { src: product.image, alt: product.name, priority: priority }), _jsxs("div", { className: "product-card__details", children: [_jsx("span", { className: "product-card__category", children: product.category?.name ?? t("uncategorized") }), (product.isFeatured || !product.isAvailable || product.stock <= 0) && (_jsxs("div", { className: "product-card__flags", children: [product.isFeatured && _jsx("span", { className: "tag", children: t("featuredLabel") }), (!product.isAvailable || product.stock <= 0) && _jsx("span", { className: "tag tag--muted", children: t("outOfStock") })] })), _jsx("h3", { children: product.name }), _jsxs("strong", { className: "product-card__price", children: ["\u20B9", product.price.toLocaleString("en-IN")] })] })] }));
};
export default ProductCard;
