import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "../services/api";
import { useAdminAuth } from "../contexts/AdminAuthContext";
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const initialFormState = {
    name: "",
    description: "",
    price: "",
    stock: "",
    image: "",
    categoryId: ""
};
const ProductsPanel = () => {
    const { token } = useAdminAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState(initialFormState);
    const [editing, setEditing] = useState(null);
    const [status, setStatus] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const thumbnailPreviewBlobRef = useRef(null);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [imageStatus, setImageStatus] = useState(null);
    const [galleryUrls, setGalleryUrls] = useState([]);
    const [isGalleryUploading, setIsGalleryUploading] = useState(false);
    const [galleryStatus, setGalleryStatus] = useState(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const dropZoneRef = useRef(null);
    const clearThumbnailBlob = () => {
        if (thumbnailPreviewBlobRef.current) {
            URL.revokeObjectURL(thumbnailPreviewBlobRef.current);
            thumbnailPreviewBlobRef.current = null;
        }
    };
    const setThumbnailPreviewFromFile = (file) => {
        clearThumbnailBlob();
        const objectUrl = URL.createObjectURL(file);
        thumbnailPreviewBlobRef.current = objectUrl;
        setThumbnailPreview(objectUrl);
    };
    const setThumbnailPreviewFromUrl = (url) => {
        clearThumbnailBlob();
        setThumbnailPreview(url);
    };
    const loadProducts = () => {
        if (!token)
            return;
        adminApi
            .get("/api/admin/products", token)
            .then(setProducts)
            .catch(console.error);
        adminApi
            .get("/api/products/categories", token)
            .then(setCategories)
            .catch(console.error);
    };
    useEffect(() => {
        loadProducts();
    }, [token]);
    useEffect(() => {
        return () => clearThumbnailBlob();
    }, []);
    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };
    const uploadGallerySelection = useCallback(async (files) => {
        if (!token) {
            setGalleryStatus("Authentication required to upload images.");
            return;
        }
        const incoming = Array.isArray(files) ? files : Array.from(files ?? []);
        if (incoming.length === 0)
            return;
        const validImages = incoming.filter((file) => ACCEPTED_IMAGE_TYPES.has(file.type));
        if (validImages.length === 0) {
            setGalleryStatus("Only JPG, JPEG, PNG, or WEBP files are allowed.");
            return;
        }
        const formData = new FormData();
        validImages.forEach((file) => formData.append("gallery", file));
        setIsGalleryUploading(true);
        setGalleryStatus(`Uploading ${validImages.length} image(s)...`);
        try {
            const response = await adminApi.uploadGallery(formData, token);
            setGalleryUrls((prev) => [...prev, ...response.urls]);
            setGalleryStatus(`${response.urls.length} image(s) uploaded`);
        }
        catch (uploadError) {
            setGalleryStatus(uploadError instanceof Error ? uploadError.message : "Image upload failed");
        }
        finally {
            setIsGalleryUploading(false);
        }
    }, [token]);
    useEffect(() => {
        const handlePaste = (event) => {
            if (!dropZoneRef.current)
                return;
            const active = document.activeElement;
            if (!active || !dropZoneRef.current.contains(active))
                return;
            const clipboardFiles = event.clipboardData?.files;
            if (!clipboardFiles || clipboardFiles.length === 0)
                return;
            event.preventDefault();
            void uploadGallerySelection(clipboardFiles);
        };
        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, [uploadGallerySelection]);
    const resetForm = () => {
        setForm(initialFormState);
        setEditing(null);
        setGalleryUrls([]);
        setThumbnailPreviewFromUrl(null);
        setImageStatus(null);
        setGalleryStatus(null);
    };
    const handleThumbnailSelect = async (file) => {
        if (!token) {
            setImageStatus("Authentication required to upload images.");
            return;
        }
        if (!file) {
            setThumbnailPreviewFromUrl(editing?.image ?? null);
            if (!editing) {
                setForm((prev) => ({ ...prev, image: "" }));
            }
            return;
        }
        if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
            setImageStatus("Only JPG, JPEG, PNG, or WEBP files are allowed.");
            return;
        }
        setImageStatus("Uploading image...");
        setIsImageUploading(true);
        setThumbnailPreviewFromFile(file);
        const formData = new FormData();
        formData.append("gallery", file);
        try {
            const response = await adminApi.uploadGallery(formData, token);
            const [url] = response.urls;
            if (!url) {
                throw new Error("No URL returned for the uploaded image");
            }
            setForm((prev) => ({ ...prev, image: url }));
            setThumbnailPreviewFromUrl(url);
            setImageStatus("Image uploaded successfully");
        }
        catch (uploadError) {
            setImageStatus(uploadError instanceof Error ? uploadError.message : "Image upload failed");
        }
        finally {
            setIsImageUploading(false);
        }
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!token)
            return;
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("description", form.description);
        formData.append("price", form.price);
        formData.append("stock", form.stock);
        formData.append("categoryId", form.categoryId);
        formData.append("gallery", JSON.stringify(galleryUrls));
        formData.append("image", form.image);
        try {
            if (editing) {
                await adminApi.putMultipart(`/api/admin/products/${editing.id}`, formData, token);
                setStatus("Product updated");
            }
            else {
                await adminApi.postMultipart("/api/admin/products", formData, token);
                setStatus("Product added");
            }
            resetForm();
            loadProducts();
        }
        catch (apiError) {
            setStatus(apiError instanceof Error ? apiError.message : "Request failed");
        }
    };
    const handleEdit = (product) => {
        setEditing(product);
        setForm({
            name: product.name,
            description: product.description,
            price: String(product.price),
            stock: String(product.stock),
            image: product.image,
            categoryId: product.category ? String(product.category.id) : ""
        });
        setGalleryUrls(product.gallery ?? []);
        setThumbnailPreviewFromUrl(product.image);
        setImageStatus(null);
        setGalleryStatus(null);
    };
    const handleDelete = async (product) => {
        if (!token)
            return;
        if (!window.confirm(`Delete "${product.name}"?`))
            return;
        await adminApi.del(`/api/admin/products/${product.id}`, token);
        loadProducts();
    };
    return (_jsxs("div", { className: "panel", children: [_jsx("h2", { children: "Product management" }), status && _jsx("p", { children: status }), _jsxs("div", { style: { display: "grid", gap: "1rem", marginTop: "1rem" }, children: [_jsxs("table", { className: "table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Name" }), _jsx("th", { children: "Price" }), _jsx("th", { children: "Stock" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: products.map((product) => (_jsxs("tr", { children: [_jsx("td", { children: product.name }), _jsxs("td", { children: ["\u20B9", product.price] }), _jsx("td", { children: product.stock }), _jsxs("td", { children: [_jsx("button", { className: "button-primary", type: "button", onClick: () => handleEdit(product), children: "Edit" }), _jsx("button", { className: "button-primary", type: "button", style: { marginLeft: "0.5rem", background: "#c0392b" }, onClick: () => handleDelete(product), children: "Delete" })] })] }, product.id))) })] }), _jsxs("form", { onSubmit: handleSubmit, encType: "multipart/form-data", style: { display: "grid", gap: "1rem" }, children: [_jsxs("div", { style: { display: "grid", gap: "0.5rem" }, children: [_jsx("label", { htmlFor: "product-name", children: "Name" }), _jsx("input", { id: "product-name", className: "input", value: form.name, onChange: (event) => handleChange("name", event.target.value) })] }), _jsxs("div", { style: { display: "grid", gap: "0.5rem" }, children: [_jsx("label", { htmlFor: "product-description", children: "Description" }), _jsx("textarea", { id: "product-description", className: "input", rows: 3, value: form.description, onChange: (event) => handleChange("description", event.target.value) })] }), _jsxs("div", { className: "panel-grid", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "product-price", children: "Price" }), _jsx("input", { id: "product-price", className: "input", type: "number", min: "0", value: form.price, onChange: (event) => handleChange("price", event.target.value) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "product-stock", children: "Stock" }), _jsx("input", { id: "product-stock", className: "input", type: "number", min: "0", value: form.stock, onChange: (event) => handleChange("stock", event.target.value) })] })] }), _jsxs("div", { className: "panel-grid", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "product-image-file", children: "Product image" }), _jsx("input", { id: "product-image-file", type: "file", accept: ".jpg,.jpeg,.png,.webp", className: "input", onChange: (event) => void handleThumbnailSelect(event.target.files?.[0] ?? null) }), (thumbnailPreview || form.image) && (_jsx("div", { style: {
                                                    marginTop: "0.75rem",
                                                    borderRadius: 12,
                                                    overflow: "hidden",
                                                    width: "100%",
                                                    maxWidth: 360,
                                                    boxShadow: "0 0 0 1px rgba(255,255,255,0.05)"
                                                }, children: _jsx("img", { src: thumbnailPreview ?? form.image, alt: "Product preview", style: { width: "100%", display: "block", objectFit: "cover" } }) })), imageStatus && (_jsx("p", { style: { fontSize: "0.75rem", marginTop: "0.35rem" }, children: isImageUploading ? `${imageStatus}` : imageStatus }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "product-category", children: "Category" }), _jsxs("select", { id: "product-category", className: "input", value: form.categoryId, onChange: (event) => handleChange("categoryId", event.target.value), children: [_jsx("option", { value: "", children: "No category" }), categories.map((category) => (_jsx("option", { value: category.id, children: category.name }, category.id)))] })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "product-gallery-files", children: "Gallery images" }), _jsx("input", { id: "product-gallery-files", className: "input", type: "file", accept: ".jpg,.jpeg,.png,.webp", multiple: true, onChange: (event) => {
                                            const files = event.target.files;
                                            if (files && files.length > 0) {
                                                void uploadGallerySelection(files);
                                                event.target.value = "";
                                            }
                                        } }), _jsx("div", { ref: dropZoneRef, tabIndex: 0, onDragOver: (event) => {
                                            event.preventDefault();
                                            setIsDragActive(true);
                                        }, onDragLeave: (event) => {
                                            event.preventDefault();
                                            setIsDragActive(false);
                                        }, onDrop: (event) => {
                                            event.preventDefault();
                                            setIsDragActive(false);
                                            void uploadGallerySelection(event.dataTransfer.files);
                                        }, style: {
                                            border: "2px dashed rgba(255,255,255,0.3)",
                                            borderRadius: 8,
                                            padding: "0.75rem",
                                            marginTop: "0.35rem",
                                            background: isDragActive ? "rgba(255,255,255,0.04)" : "transparent"
                                        }, children: _jsx("p", { style: { margin: 0, fontSize: "0.85rem" }, children: "Drag JPG, JPEG, PNG, or WEBP images here or paste (Ctrl+V) when this area is focused." }) }), galleryStatus && (_jsx("p", { style: { fontSize: "0.75rem", marginTop: "0.35rem" }, children: isGalleryUploading ? `${galleryStatus}` : galleryStatus })), galleryUrls.length > 0 && (_jsx("div", { style: {
                                            marginTop: "0.75rem",
                                            display: "grid",
                                            gap: "0.5rem",
                                            gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))"
                                        }, children: galleryUrls.map((url) => (_jsx("div", { style: {
                                                width: "100%",
                                                paddingBottom: "100%",
                                                position: "relative",
                                                borderRadius: 8,
                                                overflow: "hidden",
                                                boxShadow: "0 0 0 1px rgba(255,255,255,0.08)"
                                            }, children: _jsx("img", { src: url, alt: "Gallery preview", style: {
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover"
                                                } }) }, url))) }))] }), _jsx("button", { className: "button-primary", type: "submit", children: editing ? "Save changes" : "Add product" }), editing && (_jsx("button", { type: "button", className: "button-primary", style: { background: "#c0392b" }, onClick: resetForm, children: "Cancel" }))] })] })] }));
};
export default ProductsPanel;
