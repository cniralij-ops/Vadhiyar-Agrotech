import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useTranslation } from "../contexts/LanguageContext";
const CheckoutPage = () => {
    const t = useTranslation();
    const { user, token } = useAuth();
    const { items, subTotal, clearCart } = useCart();
    const [form, setForm] = useState({
        fullName: user?.name ?? "",
        mobile: "",
        email: user?.email ?? "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        notes: ""
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const itemPayload = useMemo(() => items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity
    })), [items]);
    const handleChange = (field, value) => {
        setForm((previous) => ({ ...previous, [field]: value }));
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user || !token) {
            setMessage(t("loginToContinue"));
            return;
        }
        if (!items.length) {
            setMessage(t("cart") + " is empty.");
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            await api.post("/api/orders", {
                items: itemPayload,
                ...form
            }, token);
            clearCart();
            setMessage(t("checkoutSuccess"));
        }
        catch (error) {
            setMessage(error.message);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("section", { className: "form-card", children: [_jsx("h2", { children: t("checkoutTitle") }), !user && (_jsx("div", { className: "alert", children: _jsx("p", { children: t("loginToContinue") }) })), items.length === 0 && (_jsx("div", { className: "alert", children: _jsx("p", { children: t("continueShopping") }) })), _jsxs("form", { onSubmit: handleSubmit, style: { display: "grid", gap: "1.25rem" }, children: [_jsxs("div", { className: "grid-two", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "fullName", children: t("deliveryDetails") }), _jsx("input", { id: "fullName", value: form.fullName, onChange: (event) => handleChange("fullName", event.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "mobile", children: "Mobile" }), _jsx("input", { id: "mobile", value: form.mobile, onChange: (event) => handleChange("mobile", event.target.value), required: true })] })] }), _jsxs("div", { className: "grid-two", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", children: "Email" }), _jsx("input", { id: "email", type: "email", value: form.email, onChange: (event) => handleChange("email", event.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "address", children: "Address" }), _jsx("input", { id: "address", value: form.address, onChange: (event) => handleChange("address", event.target.value), required: true })] })] }), _jsxs("div", { className: "grid-two", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "city", children: "City" }), _jsx("input", { id: "city", value: form.city, onChange: (event) => handleChange("city", event.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "state", children: "State" }), _jsx("input", { id: "state", value: form.state, onChange: (event) => handleChange("state", event.target.value), required: true })] })] }), _jsxs("div", { className: "grid-two", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "pincode", children: "Pincode" }), _jsx("input", { id: "pincode", value: form.pincode, onChange: (event) => handleChange("pincode", event.target.value), required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "notes", children: t("orderNotes") }), _jsx("textarea", { id: "notes", rows: 2, value: form.notes, onChange: (event) => handleChange("notes", event.target.value) })] })] }), _jsxs("div", { style: { textAlign: "right" }, children: [_jsxs("p", { children: [t("orderSummary"), ": \u20B9", subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })] }), _jsx("button", { className: "button-primary", type: "submit", disabled: loading || !items.length, children: t("placeOrder") })] }), message && _jsx("p", { className: "alert", children: message })] })] }));
};
export default CheckoutPage;
