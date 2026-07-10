import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import ProductCard from "../components/ProductCard";
import { Product } from "../types";
import { useTranslation } from "../contexts/LanguageContext";
import brandLogo from "../assets/logo.svg";

const HomePage = () => {
  const t = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Product[]>("/api/products")
      .then((data) => setProducts(data))
      .catch((error) => {
        console.error(error);
        setLoadError("Unable to load products. Start backend on port 4000.");
      });
  }, []);

  return (
    <>
      <section className="hero hero--landing">
        <div className="hero__content">
          <h1>{t("heroTagline")}</h1>
          <p>{t("heroSubtitle")}</p>
        </div>
        <div className="hero__visual">
          <div className="hero__circle">
            <img
              src={brandLogo}
              alt="Vadhiyar Agrotech logo"
              className="hero__logo"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section style={{ marginTop: "2.5rem" }}>
        <div className="section-title">
          <h2>{t("products")}</h2>
        </div>
        <div className="catalogue-callout catalogue-callout--banner">
          <span className="catalogue-callout__icon">📞</span>
          <strong>CALL ON: 9825213351</strong>
        </div>
        {loadError && <p style={{ color: "#c0382b" }}>{loadError}</p>}
        <div className="card-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
};

export default HomePage;
