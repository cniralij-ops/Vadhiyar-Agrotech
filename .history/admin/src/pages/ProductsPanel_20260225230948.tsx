import React, { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "../services/api";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import { AdminProduct } from "../types";

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
  image: string;
  categoryId: string;
}

const ProductsPanel = () => {
  const { token } = useAdminAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState<ProductForm>({
    name: "",
    description: "",
    price: "",
    stock: "",
    image: "",
    categoryId: ""
  });
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  const loadProducts = () => {
    if (!token) return;
    adminApi
      .get<AdminProduct[]>("/api/admin/products", token)
      .then(setProducts)
      .catch(console.error);
    adminApi
      .get<{ id: number; name: string; slug: string }[]>("/api/products/categories", token)
      .then(setCategories)
      .catch(console.error);
  };

  useEffect(() => {
    loadProducts();
  }, [token]);

  const handleChange = (field: keyof ProductForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const appendGalleryFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.isArray(files) ? files : Array.from(files);
    if (incoming.length === 0) return;
    const validImages = incoming.filter((file) => ACCEPTED_IMAGE_TYPES.has(file.type));
    if (validImages.length === 0) {
      setStatus("Only JPG, JPEG, PNG, or WEBP files are allowed.");
      return;
    }
    setGalleryFiles((prev) => [...prev, ...validImages]);
  }, []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!dropZoneRef.current) return;
      if (!dropZoneRef.current.contains(document.activeElement as Node)) return;
      const clipboardFiles = event.clipboardData?.files;
      if (!clipboardFiles || clipboardFiles.length === 0) return;
      event.preventDefault();
      appendGalleryFiles(clipboardFiles);
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [appendGalleryFiles]);

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", stock: "", image: "", categoryId: "" });
    setEditing(null);
    setGalleryFiles([]);
    setThumbnailFile(null);
  };

  const handleThumbnailSelect = (file?: File | null) => {
    if (!file) {
      setThumbnailFile(null);
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setStatus("Only JPG, JPEG, PNG, or WEBP files are allowed.");
      setThumbnailFile(null);
      return;
    }
    setStatus(null);
    setThumbnailFile(file);
    setForm((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (!editing && !thumbnailFile) {
      setStatus("Please upload a product image before submitting.");
      return;
    }
    const baseGallery = editing?.gallery ?? [];
    const uploadGalleryFiles = async () => {
      if (galleryFiles.length === 0) return [] as string[];
      const formData = new FormData();
      galleryFiles.forEach((file) => formData.append("gallery", file));
      const response = await adminApi.uploadGallery(formData, token);
      return response.urls;
    };
    let uploadedGallery: string[] = [];
    try {
      uploadedGallery = await uploadGalleryFiles();
    } catch (uploadError) {
      setStatus((uploadError as Error).message);
      return;
    }
    const galleryPayload = [...baseGallery, ...uploadedGallery];
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("stock", form.stock);
    formData.append("categoryId", form.categoryId);
    formData.append("gallery", JSON.stringify(galleryPayload));
    if (thumbnailFile) {
      formData.append("image", thumbnailFile);
    } else if (form.image) {
      formData.append("image", form.image);
    }
    try {
      if (editing) {
        await adminApi.putMultipart(`/api/admin/products/${editing.id}`, formData, token);
        setStatus("Product updated");
      } else {
        await adminApi.postMultipart("/api/admin/products", formData, token);
        setStatus("Product added");
      }
      resetForm();
      loadProducts();
    } catch (apiError) {
      setStatus((apiError as Error).message);
    }
  };

  const handleEdit = (product: AdminProduct) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image,
      categoryId: String(product.category.id)
    });
    setGalleryFiles([]);
    setThumbnailFile(null);
  };

  const handleDelete = async (product: AdminProduct) => {
    if (!token) return;
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    await adminApi.del(`/api/admin/products/${product.id}`, token);
    loadProducts();
  };

  return (
    <div className="panel">
      <h2>Product management</h2>
      {status && <p>{status}</p>}
      <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>₹{product.price}</td>
                <td>{product.stock}</td>
                <td>
                  <button className="button-primary" type="button" onClick={() => handleEdit(product)}>
                    Edit
                  </button>
                  <button
                    className="button-primary"
                    type="button"
                    style={{ marginLeft: "0.5rem", background: "#c0392b" }}
                    onClick={() => handleDelete(product)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <label htmlFor="product-name">Name</label>
            <input
              id="product-name"
              className="input"
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              required
            />
          </div>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <label htmlFor="product-description">Description</label>
            <textarea
              id="product-description"
              className="input"
              rows={3}
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
              required
            />
          </div>
          <div className="panel-grid">
            <div>
              <label htmlFor="product-price">Price</label>
              <input
                id="product-price"
                className="input"
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => handleChange("price", event.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="product-stock">Stock</label>
              <input
                id="product-stock"
                className="input"
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) => handleChange("stock", event.target.value)}
                required
              />
            </div>
          </div>
          <div className="panel-grid">
            <div>
              <label htmlFor="product-image-file">Product image</label>
              <input
                id="product-image-file"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="input"
                onChange={(event) => handleThumbnailSelect(event.target.files?.[0] ?? null)}
                required={!editing && !thumbnailFile}
              />
              <p style={{ fontSize: "0.75rem", marginTop: "0.35rem" }}>
                {thumbnailFile
                  ? `Selected file: ${thumbnailFile.name}`
                  : editing && form.image
                  ? "Current image will be kept unless you upload a new one."
                  : "Upload JPG, JPEG, PNG, or WEBP images."}
              </p>
            </div>
            <div>
              <label htmlFor="product-category">Category</label>
              <select
                id="product-category"
                className="input"
                value={form.categoryId}
                onChange={(event) => handleChange("categoryId", event.target.value)}
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="product-gallery-files">Gallery images</label>
            <input
              id="product-gallery-files"
              className="input"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              multiple
              onChange={(event) =>
                setGalleryFiles(
                  Array.from(event.target.files ?? []).filter((file) => ACCEPTED_IMAGE_TYPES.has(file.type))
                )
              }
            />
            <div
              ref={dropZoneRef}
              tabIndex={0}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragActive(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragActive(false);
                appendGalleryFiles(event.dataTransfer.files);
              }}
              style={{
                border: "2px dashed rgba(255,255,255,0.3)",
                borderRadius: 8,
                padding: "0.75rem",
                marginTop: "0.35rem",
                background: isDragActive ? "rgba(255,255,255,0.04)" : "transparent"
              }}
            >
              <p style={{ margin: 0, fontSize: "0.85rem" }}>
                Drag JPG, JPEG, PNG, or WEBP images here or paste (Ctrl+V) when this area is focused.
              </p>
            </div>
            {galleryFiles.length > 0 && (
              <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                {galleryFiles.map((file) => file.name).join(", ")}
              </p>
            )}
          </div>
          <button className="button-primary" type="submit">
            {editing ? "Save changes" : "Add product"}
          </button>
          {editing && (
            <button type="button" className="button-primary" style={{ background: "#c0392b" }} onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProductsPanel;
