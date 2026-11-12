import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { api } from "../services/api";
import { Product } from "../types";
import { useTranslation } from "../contexts/LanguageContext";
import { BUSINESS_INFO } from "../data/businessInfo";

const ProductsPage = () => {
  const t = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
  const appliedSearch = searchParams.get("search") ?? "";

  useEffect(() => {
    setSearchTerm(appliedSearch);
  }, [appliedSearch]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    const query = new URLSearchParams();
    if (appliedSearch) query.set("search", appliedSearch);
    api
      .get<Product[]>(`/api/products${query.toString() ? `?${query.toString()}` : ""}`)
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((error) => {
        if (!active) return;
        console.error(error);
        setProducts([]);
        setLoadError("Unable to load products. Please check backend server and API URL.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appliedSearch]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedSearch = searchTerm.trim();
    setSearchParams((params) => {
      if (normalizedSearch) {
        params.set("search", normalizedSearch);
      } else {
        params.delete("search");
      }
      return params;
    });
  };

  return (
    <section className="products-page">
      <div className="products-intro">
        <div className="products-intro__copy">
          <span className="products-eyebrow">{t("brandStatement")}</span>
          <h1>{appliedSearch ? `${t("searchPlaceholder")}: ${appliedSearch}` : t("products")}</h1>
          <p>{t("catalogueIntro")}</p>
        </div>
        <form className="product-search" onSubmit={handleSearch} role="search">
          <input
            type="search"
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button className="button-primary" type="submit">
            {t("viewProducts")}
          </button>
        </form>
      </div>

      <div className="catalogue-callout catalogue-callout--banner">
        <p>{t("supportLine")}</p>
        <a className="catalogue-callout__phone" href={BUSINESS_INFO.phoneLink}>
          <span>{BUSINESS_INFO.phone}</span>
          <span>{t("callNow")}</span>
        </a>
      </div>

      {loading ? (
        <div className="product-skeleton-grid" role="status" aria-label={t("loading")}>
          {Array.from({ length: 6 }, (_, index) => (
            <div className="product-skeleton" key={index}>
              <span className="product-skeleton__image" />
              <span className="product-skeleton__line" />
              <span className="product-skeleton__line product-skeleton__line--short" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <p className="products-error" role="alert">{loadError}</p>
      ) : products.length ? (
        <div className="card-grid">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      ) : (
        <p className="products-empty">{t("noProducts")}</p>
      )}
    </section>
  );
};

export default ProductsPage;

