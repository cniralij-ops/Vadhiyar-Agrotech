import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { adminApi } from "../services/api";
import { useAdminAuth } from "../contexts/AdminAuthContext";
const CustomersPanel = () => {
    const { token } = useAdminAuth();
    const [customers, setCustomers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loginHistory, setLoginHistory] = useState([]);
    useEffect(() => {
        if (!token)
            return;
        adminApi
            .get("/api/customers", token)
            .then(setCustomers)
            .catch(console.error);
    }, [token]);
    const loadDetails = (id) => {
        if (!token)
            return;
        adminApi
            .get(`/api/customers/${id}`, token)
            .then((data) => {
            setSelected(data);
            setLoginHistory(data.loginHistory ?? []);
        })
            .catch(console.error);
    };
    return (_jsxs("div", { className: "panel", children: [_jsx("h2", { children: "Customer management" }), _jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Name" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Joined" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: customers.map((customer) => (_jsxs("tr", { children: [_jsx("td", { children: customer.name }), _jsx("td", { children: customer.email }), _jsx("td", { children: new Date(customer.createdAt).toLocaleDateString() }), _jsx("td", { children: _jsx("button", { className: "button-primary", type: "button", onClick: () => loadDetails(customer.id), children: "View details" }) })] }, customer.id))) })] }), selected && (_jsxs("div", { style: { marginTop: "1.5rem" }, children: [_jsxs("h3", { children: [selected.name, " \u2014 ", selected.email] }), _jsxs("p", { children: ["Phone: ", selected.phone] }), _jsxs("div", { children: [_jsx("h4", { children: "Login history" }), _jsx("ul", { children: loginHistory.map((entry, index) => (_jsxs("li", { children: [entry.action, " \u2022 ", new Date(entry.createdAt).toLocaleString()] }, index))) })] })] }))] }));
};
export default CustomersPanel;
