import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { Product } from "../types";
import { useTranslation } from "../contexts/LanguageContext";
import ProductImage from "../components/ProductImage";
import { BUSINESS_INFO } from "../data/businessInfo";

const ProductDetailPage = () => {
  const t = useTranslation();
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get<Product>(`/api/products/${slug}`)
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <p>{t("loading")}</p>;
  }

  if (!product) {
    return <p>{t("outOfStock")}</p>;
  }

  return (
    <section className="form-card">
      <div style={{ display: "grid", gap: "1.2rem" }}>
        <ProductImage src={product.image} alt={product.name} priority className="product-image--detail" />
        <div>
          <h1>{product.name}</h1>
          <strong style={{ fontSize: "1.75rem" }}>₹{product.price.toLocaleString("en-IN")}</strong>
          <p className={product.isAvailable && product.stock > 0 ? "product-availability" : "product-availability product-availability--out"}>
            {product.isAvailable && product.stock > 0 ? t("inStock") : t("outOfStock")}
          </p>
          <div className="catalogue-callout" style={{ marginTop: "1rem" }}>
            <p>{t("catalogueMessage")}</p>
            <a href={BUSINESS_INFO.phoneLink} className="button-primary">
              {t("callNow")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetailPage;

