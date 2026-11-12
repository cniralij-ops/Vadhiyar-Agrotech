import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useTranslation } from "../contexts/LanguageContext";
const CartPage = () => {
    const { items, updateQuantity, removeFromCart, subTotal } = useCart();
    const t = useTranslation();
    if (!items.length) {
        return (_jsxs("section", { style: { textAlign: "center" }, children: [_jsx("h2", { children: t("cart") }), _jsx("p", { children: t("continueShopping") }), _jsx(Link, { to: "/products", className: "button-primary", children: t("viewProducts") })] }));
    }
    return (_jsxs("section", { children: [_jsx("h2", { children: t("cart") }), _jsxs("div", { className: "form-card", children: [_jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Product" }), _jsx("th", { children: t("quantity") }), _jsx("th", { children: t("total") }), _jsx("th", {})] }) }), _jsx("tbody", { children: items.map((item) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("strong", { children: item.product.name }), _jsxs("p", { style: { margin: 0 }, children: ["\u20B9", item.product.price.toLocaleString("en-IN"), " \u00B7 ", item.product.stock ? `${item.product.stock} left` : t("outOfStock")] })] }), _jsx("td", { children: _jsx("input", { type: "number", min: 1, max: item.product.stock || 1, value: item.quantity, onChange: (event) => updateQuantity(item.product.id, Number(event.target.value)) }) }), _jsxs("td", { children: ["\u20B9", (item.product.price * item.quantity).toLocaleString("en-IN")] }), _jsx("td", { children: _jsx("button", { type: "button", className: "button-primary", onClick: () => removeFromCart(item.product.id), children: t("remove") }) })] }, item.product.id))) })] }), _jsxs("div", { style: { textAlign: "right", marginTop: "1rem" }, children: [_jsxs("strong", { children: [t("orderSummary"), ": \u20B9", subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })] }), _jsx("div", { children: _jsx(Link, { to: "/checkout", className: "button-primary", style: { marginTop: "0.5rem" }, children: t("checkoutTitle") }) })] })] })] }));
};
export default CartPage;
