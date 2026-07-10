import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useTranslation } from "../contexts/LanguageContext";

const CartPage = () => {
  const { items, updateQuantity, removeFromCart, subTotal } = useCart();
  const t = useTranslation();

  if (!items.length) {
    return (
      <section style={{ textAlign: "center" }}>
        <h2>{t("cart")}</h2>
        <p>{t("continueShopping")}</p>
        <Link to="/products" className="button-primary">
          {t("viewProducts")}
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h2>{t("cart")}</h2>
      <div className="form-card">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>{t("quantity")}</th>
              <th>{t("total")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.product.id}>
                <td>
                  <strong>{item.product.name}</strong>
                  <p style={{ margin: 0 }}>
                    ₹{item.product.price} • {item.product.stock ? `${item.product.stock} left` : t("outOfStock")}
                  </p>
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={item.product.stock || 1}
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.product.id, Number(event.target.value))}
                  />
                </td>
                <td>₹{item.product.price * item.quantity}</td>
                <td>
                  <button type="button" className="button-primary" onClick={() => removeFromCart(item.product.id)}>
                    {t("remove")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: "right", marginTop: "1rem" }}>
          <strong>
            {t("orderSummary")}: ₹{subTotal.toFixed(2)}
          </strong>
          <div>
            <Link to="/checkout" className="button-primary" style={{ marginTop: "0.5rem" }}>
              {t("checkoutTitle")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartPage;
