import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { useAuth, AuthUser } from "../contexts/AuthContext";
import { Category, Product } from "../types";
import ProductImage from "../components/ProductImage";
import { useTranslation } from "../contexts/LanguageContext";

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
  image: string;
  categoryId: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isVisible: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  image: "",
  categoryId: "",
  isAvailable: true,
  isFeatured: false,
  isVisible: true
};

const OwnerProductsPage = () => {
  const { user, token, loginAsOwner, logout } = useAuth();
  const t = useTranslation();
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);
  const [ownerVerified, setOwnerVerified] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const imagePreviewBlob = useRef<string | null>(null);

  const replaceImagePreview = (preview: string | null) => {
    if (imagePreviewBlob.current) {
      URL.revokeObjectURL(imagePreviewBlob.current);
      imagePreviewBlob.current = null;
    }
    if (preview?.startsWith("blob:")) imagePreviewBlob.current = preview;
    setImagePreview(preview);
  };

  useEffect(() => () => {
    if (imagePreviewBlob.current) URL.revokeObjectURL(imagePreviewBlob.current);
  }, []);

  useEffect(() => {
    let active = true;
    if (!token || user?.role !== "ADMIN") {
      setOwnerVerified(false);
      setCheckingOwner(false);
      return () => { active = false; };
    }

    setCheckingOwner(true);
    api.get<AuthUser>("/api/auth/me", token)
      .then((profile) => {
        if (!active) return;
        if (profile.role !== "ADMIN" || profile.isOwner !== true) {
          setOwnerVerified(false);
          logout();
          return;
        }
        setOwnerVerified(true);
      })
      .catch((authError) => {
        if (!active) return;
        setOwnerVerified(false);
        setLoginError(authError instanceof Error ? authError.message : "Owner session could not be verified.");
        logout();
      })
      .finally(() => {
        if (active) setCheckingOwner(false);
      });

    return () => { active = false; };
  }, [token, user?.role]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setDataLoading(true);
    setError(null);
    try {
      const [productRows, categoryRows] = await Promise.all([
        api.get<Product[]>("/api/admin/products", token),
        api.get<Category[]>("/api/products/categories", token)
      ]);
      setProducts(productRows);
      setCategories(categoryRows);
      setForm((previous) => previous.categoryId || !categoryRows.length
        ? previous
        : { ...previous, categoryId: String(categoryRows[0].id) });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Products could not be loaded.");
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (ownerVerified) void loadData();
  }, [ownerVerified, loadData]);

  const handleOwnerLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      await loginAsOwner({ password });
      setPassword("");
    } catch (authError) {
      setLoginError(authError instanceof Error ? authError.message : "Unable to sign in.");
    } finally {
      setLoginLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, categoryId: categories.length ? String(categories[0].id) : "" });
    setEditing(null);
    setSelectedImage(null);
    replaceImagePreview(null);
    setError(null);
    setMessage(null);
  };

  const editProduct = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image,
      categoryId: String(product.category.id),
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      isVisible: product.isVisible
    });
    setSelectedImage(null);
    replaceImagePreview(product.image || null);
    setError(null);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError("Choose a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setError(null);
    setSelectedImage(file);
    replaceImagePreview(URL.createObjectURL(file));
  };

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Owner authentication is required.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      let image = form.image;
      if (selectedImage) {
        const upload = new FormData();
        upload.append("gallery", selectedImage);
        const result = await api.post<{ urls: string[] }>("/api/admin/products/gallery", upload, token);
        if (!result.urls[0]) throw new Error("The uploaded image was not saved.");
        image = result.urls[0];
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        image,
        categoryId: Number(form.categoryId),
        isAvailable: form.isAvailable,
        isFeatured: form.isFeatured,
        isVisible: form.isVisible
      };
      if (editing) {
        await api.put(`/api/admin/products/${editing.id}`, payload, token);
        setMessage("Product updated.");
      } else {
        await api.post("/api/admin/products", payload, token);
        setMessage("Product added.");
      }
      setForm({ ...EMPTY_FORM, categoryId: categories.length ? String(categories[0].id) : "" });
      setEditing(null);
      setSelectedImage(null);
      replaceImagePreview(null);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Product could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!token || !window.confirm(`Delete “${product.name}” from the catalog?`)) return;
    setError(null);
    setMessage(null);
    try {
      const result = await api.del<{ archived?: boolean }>(`/api/admin/products/${product.id}`, token);
      setMessage(result.archived
        ? "Product hidden from the catalog; its order history has been preserved."
        : "Product deleted.");
      if (editing?.id === product.id) resetForm();
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Product could not be deleted.");
    }
  };

  if (checkingOwner) {
    return <section className="owner-page"><p role="status">{t("loading")}</p></section>;
  }

  if (!ownerVerified) {
    return (
      <section className="owner-page owner-login">
        <div className="owner-login__card">
          <span className="products-eyebrow">{t("ownerLogin")}</span>
          <h1>Vadhiyar Agrotech</h1>
          <p>Sign in with the authorized owner account to manage the public product catalog.</p>
          <form onSubmit={handleOwnerLogin}>
            <label htmlFor="owner-password">Password</label>
            <input id="owner-password" type="password" autoComplete="current-password" minLength={14} required value={password} onChange={(event) => setPassword(event.target.value)} />
            {loginError && <p className="owner-message owner-message--error" role="alert">{loginError}</p>}
            <button className="button-primary" type="submit" disabled={loginLoading}>
              {loginLoading ? "Signing in..." : t("ownerLogin")}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="owner-page">
      <div className="owner-page__header">
        <div>
          <span className="products-eyebrow">Owner access</span>
          <h1>Product management</h1>
          <p>Changes are saved to the catalog and appear on the public website.</p>
        </div>
        <button className="button-secondary" type="button" onClick={logout}>Sign out</button>
      </div>

      {error && <p className="owner-message owner-message--error" role="alert">{error}</p>}
      {message && <p className="owner-message" role="status">{message}</p>}

      <form className="owner-form" onSubmit={saveProduct}>
        <div className="owner-form__heading">
          <div>
            <h2>{editing ? "Edit product" : "Add a product"}</h2>
            <p>Images are optional; products without a photo use the site placeholder.</p>
          </div>
          {editing && <button className="button-secondary" type="button" onClick={resetForm}>Cancel edit</button>}
        </div>

        <div className="owner-form__grid">
          <label>
            Product name
            <input required minLength={3} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            Category
            <select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
              <option value="" disabled>Select a category</option>
              {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label>
            Price (₹)
            <input type="number" min="0.01" step="0.01" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
          </label>
          <label>
            Stock quantity
            <input type="number" min="0" step="1" required value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
          </label>
          <label className="owner-form__wide">
            Description
            <textarea required minLength={10} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className="owner-form__wide">
            Product image (JPG, PNG, WEBP · max 5 MB)
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
          </label>
          <div className="owner-form__preview">
            <ProductImage src={imagePreview ?? ""} alt={form.name || "Product image preview"} />
            <button className="text-button" type="button" onClick={() => {
              setSelectedImage(null);
              setForm((previous) => ({ ...previous, image: "" }));
              replaceImagePreview(null);
            }}>Remove image</button>
          </div>
          <fieldset className="owner-form__options">
            <legend>Product settings</legend>
            <label><input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} /> Available for ordering</label>
            <label><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} /> Featured product</label>
            <label><input type="checkbox" checked={form.isVisible} onChange={(event) => setForm({ ...form, isVisible: event.target.checked })} /> Visible in public catalog</label>
          </fieldset>
        </div>
        <div className="owner-form__actions">
          <button className="button-primary" type="submit" disabled={saving || !categories.length}>
            {saving ? "Saving..." : editing ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>

      <section className="owner-products" aria-labelledby="owner-products-title">
        <div className="owner-form__heading">
          <div>
            <h2 id="owner-products-title">Catalog products</h2>
            <p>{products.length} product{products.length === 1 ? "" : "s"}</p>
          </div>
          <button className="button-secondary" type="button" onClick={() => void loadData()} disabled={dataLoading}>
            {dataLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
        {dataLoading && !products.length ? (
          <p role="status">{t("loading")}</p>
        ) : products.length ? (
          <div className="owner-product-list">
            {products.map((product) => (
              <article className="owner-product" key={product.id}>
                <ProductImage src={product.image} alt={product.name} />
                <div className="owner-product__details">
                  <span className="product-card__category">{product.category.name}</span>
                  <h3>{product.name}</h3>
                  <p>₹{product.price.toLocaleString("en-IN")} · {product.stock} in stock</p>
                  <div className="owner-product__tags">
                    <span className="tag">{product.isVisible ? "Visible" : "Hidden"}</span>
                    <span className="tag">{product.isAvailable ? "Available" : "Unavailable"}</span>
                    {product.isFeatured && <span className="tag">Featured</span>}
                  </div>
                </div>
                <div className="owner-product__actions">
                  <button className="button-secondary" type="button" onClick={() => editProduct(product)}>Edit</button>
                  <button className="button-danger" type="button" onClick={() => void deleteProduct(product)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="products-empty">No products in the catalog yet.</p>
        )}
      </section>
    </section>
  );
};

export default OwnerProductsPage;
