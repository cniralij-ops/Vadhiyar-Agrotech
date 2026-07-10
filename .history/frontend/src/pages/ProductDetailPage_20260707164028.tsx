import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { Product } from "../types";
import { useCart } from "../contexts/CartContext";
import { useTranslation } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

const ProductDetailPage = () => {
  const t = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get<Product>(`/api/products/${slug}`)
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (user && authMessage) {
      setAuthMessage(null);
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    }
  }, [user, authMessage]);

  useEffect(() => () => {
    if (redirectTimeoutRef.current) {
      window.clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
  }, []);

  if (loading) {
    return <p>{t("loading")}</p>;
  }

  if (!product) {
    return <p>{t("outOfStock")}</p>;
  }

  const handleAdd = () => {
    if (!user) {
      setAuthMessage("Please login or register to add items to your cart.");
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
      redirectTimeoutRef.current = window.setTimeout(() => {
        navigate("/auth");
        redirectTimeoutRef.current = null;
      }, 1500);
      return;
    }
    setAuthMessage(null);
    addToCart(product, quantity);
  };

  return (
    <section className="form-card">
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <img src={product.image} alt={product.name} style={{ flex: "1", minWidth: 240, borderRadius: 20 }} />
          <div style={{ flex: 1 }}>
            <p className="tag">{product.category.name}</p>
            <h1>{product.name}</h1>
            <p style={{ color: "var(--muted)" }}>{product.description}</p>
            <strong style={{ fontSize: "1.75rem" }}>₹{product.price}</strong>
            <p>{product.stock ? `${product.stock} ${t("quantity")}` : t("outOfStock")}</p>
            {user && (
              <div style={{ marginTop: 12 }}>
                <h3 style={{ margin: "0 0 0.5rem 0" }}>Address</h3>
                <p style={{ color: "var(--muted)" }}>
                  {(user as any).addressLine || (user as any).address || "No address on file"}
                </p>
                {(((user as any).city) || ((user as any).state)) && (
                  <p style={{ color: "var(--muted)" }}>
                    {[(user as any).city, (user as any).state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="grid-two">
          <div>
            <label htmlFor="quantity">{t("quantity")}</label>
            <input
              type="number"
              id="quantity"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <button className="button-primary" onClick={handleAdd} disabled={!product.stock}>
              {t("addToCart")}
            </button>
            {authMessage && <div className="alert">{authMessage}</div>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetailPage;
