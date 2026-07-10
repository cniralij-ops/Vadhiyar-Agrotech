import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import logo from "./assets/logo.svg";
import { useAdminAuth } from "./contexts/AdminAuthContext";
import DashboardPanel from "./pages/DashboardPanel";
import ProductsPanel from "./pages/ProductsPanel";
import OrdersPanel from "./pages/OrdersPanel";
import CustomersPanel from "./pages/CustomersPanel";
import LoginPage from "./pages/LoginPage";
const tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "products", label: "Products" },
    { key: "orders", label: "Orders" },
    { key: "customers", label: "Customers" }
];
const App = () => {
    const { user, logout, isInitializing } = useAdminAuth();
    const [activeTab, setActiveTab] = useState("dashboard");
    if (isInitializing) {
        return _jsx("p", { style: { padding: "2rem" }, children: "Checking session..." });
    }
    if (!user) {
        return _jsx(LoginPage, {});
    }
    const renderPanel = () => {
        switch (activeTab) {
            case "products":
                return _jsx(ProductsPanel, {});
            case "orders":
                return _jsx(OrdersPanel, {});
            case "customers":
                return _jsx(CustomersPanel, {});
            default:
                return _jsx(DashboardPanel, {});
        }
    };
    return (_jsxs("div", { className: "admin-shell", children: [_jsxs("header", { className: "admin-header", children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.9rem" }, children: [_jsx("img", { src: logo, alt: "Vadhiyar Agrotech", width: 48, height: 48 }), _jsxs("div", { children: [_jsx("strong", { children: "Vadhiyar Agrotech Admin" }), _jsx("div", { className: "small-tag", children: user.name })] })] }), _jsx("nav", { children: tabs.map((tab) => (_jsx("button", { type: "button", className: activeTab === tab.key ? "active" : undefined, onClick: () => setActiveTab(tab.key), style: {
                                background: "transparent",
                                border: "none",
                                color: activeTab === tab.key ? "var(--accent)" : "var(--muted)",
                                cursor: "pointer",
                                fontWeight: 500
                            }, children: tab.label }, tab.key))) }), _jsx("button", { className: "button-primary", onClick: logout, children: "Logout" })] }), _jsx("main", { className: "admin-content", children: renderPanel() })] }));
};
export default App;
