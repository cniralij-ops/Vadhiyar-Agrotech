import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../services/api";
import ProductCard from "../components/ProductCard";
import { Product } from "../types";
import { useTranslation } from "../contexts/LanguageContext";
import brandLogo from "../assets/vadhiyar-logo.jpeg";
import { BUSINESS_INFO } from "../data/businessInfo";

const HomePage = () => {
  const t = useTranslation();
  const { hash } = useLocation();
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

  useEffect(() => {
    if (hash === "#about") {
      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash]);

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
          <p>{t("supportLine")}</p>
          <a className="catalogue-callout__phone" href={BUSINESS_INFO.phoneLink}>
            <span>{BUSINESS_INFO.phone}</span>
            <span>{t("callNow")}</span>
          </a>
        </div>
        {loadError && <p style={{ color: "#c0382b" }}>{loadError}</p>}
        <div className="card-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="about-section" id="about" aria-labelledby="about-title">
        <div className="about-section__intro">
          <span className="products-eyebrow">{t("aboutUs")}</span>
          <h2 id="about-title">{BUSINESS_INFO.name}</h2>
          <p>{t("aboutDescription")}</p>
          <p className="about-section__owner">
            <strong>{BUSINESS_INFO.owner}</strong> · {t("proprietor")}
          </p>
          <p className="about-section__legal" lang="gu">{BUSINESS_INFO.legalNameGujarati}</p>
          <p className="about-section__slogan" lang="gu">{BUSINESS_INFO.sloganGujarati}</p>
        </div>
        <div className="about-section__details">
          <h3>{t("services")}</h3>
          <ul className="about-section__services">
            {BUSINESS_INFO.services.map((service) => <li key={service}>{service}</li>)}
          </ul>
          <div className="about-section__values" aria-label="Business values">
            {BUSINESS_INFO.values.map((value) => <span className="tag" key={value}>{value}</span>)}
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;

