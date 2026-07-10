import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/LanguageContext";
const OrdersPage = () => {
    const { user, token } = useAuth();
    const t = useTranslation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (!user || !token)
            return;
        setLoading(true);
        api
            .get("/api/orders", token)
            .then(setOrders)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user, token]);
    if (!user || !token) {
        return (_jsx("section", { className: "form-card", children: _jsx("p", { children: t("loginToContinue") }) }));
    }
    return (_jsxs("section", { children: [_jsx("h2", { children: t("orderHistory") }), loading ? (_jsx("p", { children: t("loading") })) : (_jsx("div", { className: "card-grid", children: orders.map((order) => (_jsxs("article", { className: "product-card", children: [_jsxs("div", { children: [_jsxs("h3", { children: [t("orderId"), ": #", order.id] }), _jsxs("p", { children: [t("status"), ": ", t(order.status.toLowerCase())] }), _jsx("p", { children: order.fullName }), _jsxs("p", { children: [t("total"), ": \u20B9", order.total.toFixed(2)] })] }), _jsxs("div", { children: [_jsx("strong", { children: new Date(order.createdAt).toLocaleDateString() }), _jsx("ul", { children: order.items.map((item) => (_jsxs("li", { children: [item.product.name, " \u00D7", item.quantity] }, item.id))) })] })] }, order.id))) }))] }));
};
export default OrdersPage;
