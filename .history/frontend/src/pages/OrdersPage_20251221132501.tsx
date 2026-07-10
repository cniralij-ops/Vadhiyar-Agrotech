import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Order } from "../types";
import { useTranslation } from "../contexts/LanguageContext";

const OrdersPage = () => {
  const { user, token } = useAuth();
  const t = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !token) return;
    setLoading(true);
    api
      .get<Order[]>("/api/orders", token)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, token]);

  if (!user || !token) {
    return (
      <section className="form-card">
        <p>{t("loginToContinue")}</p>
      </section>
    );
  }

  return (
    <section>
      <h2>{t("orderHistory")}</h2>
      {loading ? (
        <p>{t("loading")}</p>
      ) : (
        <div className="card-grid">
          {orders.map((order) => (
            <article key={order.id} className="product-card">
              <div>
                <h3>{t("orderId")}: #{order.id}</h3>
                <p>
                  {t("status")}: {t(order.status.toLowerCase() as "pending" | "processing" | "delivered" | "cancelled")}
                </p>
                <p>{order.fullName}</p>
                <p>{t("total")}: ₹{order.total.toFixed(2)}</p>
              </div>
              <div>
                <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                <ul>
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.product.name} ×{item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default OrdersPage;
