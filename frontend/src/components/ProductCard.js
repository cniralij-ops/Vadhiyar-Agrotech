import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
const ProductCard = ({ product }) => {
    return (_jsxs(Link, { to: `/products/${product.slug}`, className: "product-card product-card--catalogue", children: [_jsx("img", { src: product.image, alt: product.name }), _jsx("div", { children: _jsx("h3", { children: product.name }) }), _jsxs("strong", { style: { fontSize: "1.2rem" }, children: ["\u20B9", product.price] })] }));
};
export default ProductCard;
