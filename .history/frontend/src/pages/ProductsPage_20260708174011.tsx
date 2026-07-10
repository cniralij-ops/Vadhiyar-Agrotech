import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { api } from "../services/api";
import { Product } from "../types";
import { useTranslation } from "../contexts/LanguageContext";

const ProductsPage = () => {
  const t = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    const query = new URLSearchParams();
    if (searchTerm) query.set("search", searchTerm);
    api
      .get<Product[]>(`/api/products${query.toString() ? `?${query.toString()}` : ""}`)
      .then((data) => setProducts(data))
      .catch((error) => {
        console.error(error);
        setProducts([]);
        setLoadError("Unable to load products. Please check backend server and API URL.");
      })
      .finally(() => setLoading(false));
  }, [searchTerm]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchParams((params) => {
      if (searchTerm) {
        params.set("search", searchTerm);
      } else {
        params.delete("search");
      }
      return params;
    });
  };

  const headerLabel = useMemo(() => {
    if (searchTerm) {
      return `${t("searchPlaceholder")} · ${searchTerm}`;
    }
    return t("products");
  }, [searchTerm, t]);

  return (
    <section>
      <div className="section-title" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <h2>{headerLabel}</h2>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="search"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{ padding: "0.65rem 0.8rem", borderRadius: "12px", border: "1px solid var(--border)" }}
          />
          <button className="button-primary" type="submit">
            {t("viewProducts")}
          </button>
        </form>
      </div>

      <div className="catalogue-callout">
        <p>{t("catalogueMessage")}</p>
        <a href="tel:9825213351" className="button-primary">
          {t("callNow")}
        </a>
      </div>

      {loading ? (
        <p>{t("loading")}</p>
      ) : loadError ? (
        <p style={{ color: "#c0382b" }}>{loadError}</p>
      ) : products.length ? (
        <div className="card-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p>{t("noProducts")}</p>
      )}
    </section>
  );
};

export default ProductsPage;
