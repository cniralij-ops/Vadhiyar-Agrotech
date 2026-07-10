import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { adminApi } from "../services/api";
import { useAdminAuth } from "../contexts/AdminAuthContext";
const DashboardPanel = () => {
    const { token } = useAdminAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const loadDashboard = async () => {
        if (!token)
            return;
        setLoading(true);
        setError(null);
        try {
            const data = await adminApi.get("/api/admin/dashboard", token);
            setSummary(data);
        }
        catch (apiError) {
            setSummary(null);
            setError(apiError.message);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadDashboard();
    }, [token]);
    if (loading && !summary) {
        return _jsx("p", { children: "Loading dashboard\u2026" });
    }
    if (error) {
        return (_jsxs("div", { className: "panel", children: [_jsx("h2", { children: "Dashboard unavailable" }), _jsx("p", { children: error }), _jsx("button", { type: "button", className: "button-primary", onClick: loadDashboard, children: "Try again" })] }));
    }
    if (!summary) {
        return _jsx("p", { children: "No dashboard data yet." });
    }
    return (_jsxs("div", { className: "panel", children: [_jsx("h2", { children: "Executive summary" }), _jsxs("div", { className: "panel-grid", children: [_jsxs("div", { className: "stat-card", children: [_jsx("p", { children: "Total customers" }), _jsx("strong", { children: summary.totalCustomers })] }), _jsxs("div", { className: "stat-card", children: [_jsx("p", { children: "Total orders" }), _jsx("strong", { children: summary.totalOrders })] }), _jsxs("div", { className: "stat-card", children: [_jsx("p", { children: "Total revenue" }), _jsxs("strong", { children: ["\u20B9", summary.totalRevenue.toFixed(2)] })] })] }), _jsxs("div", { style: { marginTop: "1.5rem" }, children: [_jsx("h3", { children: "Recent activity" }), _jsx("ul", { children: summary.recentActivity.map((item) => (_jsxs("li", { style: { marginBottom: "0.4rem" }, children: [_jsx("strong", { children: item.user.name }), " ", item.action, " \u2022 ", new Date(item.createdAt).toLocaleString()] }, item.id))) })] })] }));
};
export default DashboardPanel;
