import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { adminApi } from "../services/api";
import { useAdminAuth } from "../contexts/AdminAuthContext";
const statuses = ["PENDING", "PROCESSING", "DELIVERED", "CANCELLED"];
const OrdersPanel = () => {
    const { token } = useAdminAuth();
    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState(null);
    const loadOrders = () => {
        if (!token)
            return;
        adminApi
            .get("/api/admin/orders", token)
            .then(setOrders)
            .catch(console.error);
    };
    useEffect(() => {
        loadOrders();
    }, [token]);
    const handleStatusChange = async (orderId, nextStatus) => {
        if (!token)
            return;
        try {
            await adminApi.put(`/api/admin/orders/${orderId}/status`, { status: nextStatus }, token);
            setStatus("Status updated");
            loadOrders();
        }
        catch (apiError) {
            setStatus(apiError.message);
        }
    };
    return (_jsxs("div", { className: "panel", children: [_jsx("h2", { children: "Order management" }), status && _jsx("p", { children: status }), _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Order" }), _jsx("th", { children: "Customer" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Total" }), _jsx("th", { children: "Items" })] }) }), _jsx("tbody", { children: orders.map((order) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsxs("strong", { children: ["#", order.id] }), _jsx("p", { className: "small-tag", children: new Date(order.createdAt).toLocaleDateString() })] }), _jsxs("td", { children: [_jsx("p", { children: order.user.name }), _jsx("p", { className: "small-tag", children: order.email })] }), _jsx("td", { children: _jsx("select", { value: order.status, onChange: (event) => handleStatusChange(order.id, event.target.value), children: statuses.map((item) => (_jsx("option", { value: item, children: item }, item))) }) }), _jsxs("td", { children: ["\u20B9", order.total.toFixed(2)] }), _jsx("td", { children: _jsx("ul", { children: order.items.map((item) => (_jsxs("li", { children: [item.product.name, " \u00D7 ", item.quantity] }, item.id))) }) })] }, order.id))) })] })] }));
};
export default OrdersPanel;
