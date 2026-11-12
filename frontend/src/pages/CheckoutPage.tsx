import React, { useMemo, useState } from "react";
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
  const [message, setMessage] = useState<string | null>(null);

  const itemPayload = useMemo(
    () =>
      items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity
      })),
    [items]
  );

  const handleChange = (field: string, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
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
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-card">
      <h2>{t("checkoutTitle")}</h2>
      {!user && (
        <div className="alert">
          <p>{t("loginToContinue")}</p>
        </div>
      )}
      {items.length === 0 && (
        <div className="alert">
          <p>{t("continueShopping")}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.25rem" }}>
        <div className="grid-two">
          <div>
            <label htmlFor="fullName">{t("deliveryDetails")}</label>
            <input
              id="fullName"
              value={form.fullName}
              onChange={(event) => handleChange("fullName", event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="mobile">Mobile</label>
            <input
              id="mobile"
              value={form.mobile}
              onChange={(event) => handleChange("mobile", event.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid-two">
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="address">Address</label>
            <input
              id="address"
              value={form.address}
              onChange={(event) => handleChange("address", event.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid-two">
          <div>
            <label htmlFor="city">City</label>
            <input
              id="city"
              value={form.city}
              onChange={(event) => handleChange("city", event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="state">State</label>
            <input
              id="state"
              value={form.state}
              onChange={(event) => handleChange("state", event.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid-two">
          <div>
            <label htmlFor="pincode">Pincode</label>
            <input
              id="pincode"
              value={form.pincode}
              onChange={(event) => handleChange("pincode", event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="notes">{t("orderNotes")}</label>
            <textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={(event) => handleChange("notes", event.target.value)}
            />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p>
            {t("orderSummary")}: ₹{subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <button className="button-primary" type="submit" disabled={loading || !items.length}>
            {t("placeOrder")}
          </button>
        </div>
        {message && <p className="alert">{message}</p>}
      </form>
    </section>
  );
};

export default CheckoutPage;

