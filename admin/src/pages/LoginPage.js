import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAdminAuth } from "../contexts/AdminAuthContext";
const LoginPage = () => {
    const { login } = useAdminAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await login({ email: form.email, password: form.password });
        }
        catch (apiError) {
            setError(apiError.message);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "admin-shell", style: { justifyContent: "center" }, children: _jsx("div", { className: "admin-content", style: { maxWidth: 420, width: "100%" }, children: _jsxs("div", { className: "panel", children: [_jsx("h2", { children: "Admin Access" }), _jsx("p", { children: "Secure login for Vadhiyar Agrotech administrators." }), _jsxs("form", { onSubmit: handleSubmit, style: { display: "grid", gap: "1rem", marginTop: "1rem" }, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "admin-email", children: "Email" }), _jsx("input", { id: "admin-email", type: "email", className: "input", value: form.email, onChange: (event) => handleChange("email", event.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "admin-password", children: "Password" }), _jsx("input", { id: "admin-password", type: "password", className: "input", value: form.password, onChange: (event) => handleChange("password", event.target.value), required: true })] }), error && _jsx("div", { className: "alert", children: error }), _jsx("button", { className: "button-primary", type: "submit", disabled: loading, children: loading ? "Signing in..." : "Access dashboard" })] })] }) }) }));
};
export default LoginPage;
