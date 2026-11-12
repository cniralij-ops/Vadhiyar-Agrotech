import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ProductImage from "../components/ProductImage";
import { useTranslation } from "../contexts/LanguageContext";
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const EMPTY_FORM = {
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
    const [loginError, setLoginError] = useState(null);
    const [loginLoading, setLoginLoading] = useState(false);
    const [checkingOwner, setCheckingOwner] = useState(true);
    const [ownerVerified, setOwnerVerified] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editing, setEditing] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const imagePreviewBlob = useRef(null);
    const replaceImagePreview = (preview) => {
        if (imagePreviewBlob.current) {
            URL.revokeObjectURL(imagePreviewBlob.current);
            imagePreviewBlob.current = null;
        }
        if (preview?.startsWith("blob:"))
            imagePreviewBlob.current = preview;
        setImagePreview(preview);
    };
    useEffect(() => () => {
        if (imagePreviewBlob.current)
            URL.revokeObjectURL(imagePreviewBlob.current);
    }, []);
    useEffect(() => {
        let active = true;
        if (!token || user?.role !== "ADMIN") {
            setOwnerVerified(false);
            setCheckingOwner(false);
            return () => { active = false; };
        }
        setCheckingOwner(true);
        api.get("/api/auth/me", token)
            .then((profile) => {
            if (!active)
                return;
            if (profile.role !== "ADMIN" || profile.isOwner !== true) {
                setOwnerVerified(false);
                logout();
                return;
            }
            setOwnerVerified(true);
        })
            .catch((authError) => {
            if (!active)
                return;
            setOwnerVerified(false);
            setLoginError(authError instanceof Error ? authError.message : "Owner session could not be verified.");
            logout();
        })
            .finally(() => {
            if (active)
                setCheckingOwner(false);
        });
        return () => { active = false; };
    }, [token, user?.role]);
    const loadData = useCallback(async () => {
        if (!token)
            return;
        setDataLoading(true);
        setError(null);
        try {
            const [productRows, categoryRows] = await Promise.all([
                api.get("/api/admin/products", token),
                api.get("/api/products/categories", token)
            ]);
            setProducts(productRows);
            setCategories(categoryRows);
            setForm((previous) => previous.categoryId || !categoryRows.length
                ? previous
                : { ...previous, categoryId: String(categoryRows[0].id) });
        }
        catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Products could not be loaded.");
        }
        finally {
            setDataLoading(false);
        }
    }, [token]);
    useEffect(() => {
        if (ownerVerified)
            void loadData();
    }, [ownerVerified, loadData]);
    const handleOwnerLogin = async (event) => {
        event.preventDefault();
        setLoginError(null);
        setLoginLoading(true);
        try {
            await loginAsOwner({ password });
            setPassword("");
        }
        catch (authError) {
            setLoginError(authError instanceof Error ? authError.message : "Unable to sign in.");
        }
        finally {
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
    const editProduct = (product) => {
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
    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
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
    const saveProduct = async (event) => {
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
                const result = await api.post("/api/admin/products/gallery", upload, token);
                if (!result.urls[0])
                    throw new Error("The uploaded image was not saved.");
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
            }
            else {
                await api.post("/api/admin/products", payload, token);
                setMessage("Product added.");
            }
            setForm({ ...EMPTY_FORM, categoryId: categories.length ? String(categories[0].id) : "" });
            setEditing(null);
            setSelectedImage(null);
            replaceImagePreview(null);
            await loadData();
        }
        catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Product could not be saved.");
        }
        finally {
            setSaving(false);
        }
    };
    const deleteProduct = async (product) => {
        if (!token || !window.confirm(`Delete “${product.name}” from the catalog?`))
            return;
        setError(null);
        setMessage(null);
        try {
            const result = await api.del(`/api/admin/products/${product.id}`, token);
            setMessage(result.archived
                ? "Product hidden from the catalog; its order history has been preserved."
                : "Product deleted.");
            if (editing?.id === product.id)
                resetForm();
            await loadData();
        }
        catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Product could not be deleted.");
        }
    };
    if (checkingOwner) {
        return _jsx("section", { className: "owner-page", children: _jsx("p", { role: "status", children: t("loading") }) });
    }
    if (!ownerVerified) {
        return (_jsx("section", { className: "owner-page owner-login", children: _jsxs("div", { className: "owner-login__card", children: [_jsx("span", { className: "products-eyebrow", children: t("ownerLogin") }), _jsx("h1", { children: "Vadhiyar Agrotech" }), _jsx("p", { children: "Sign in with the authorized owner account to manage the public product catalog." }), _jsxs("form", { onSubmit: handleOwnerLogin, children: [_jsx("label", { htmlFor: "owner-password", children: "Password" }), _jsx("input", { id: "owner-password", type: "password", autoComplete: "current-password", minLength: 14, required: true, value: password, onChange: (event) => setPassword(event.target.value) }), loginError && _jsx("p", { className: "owner-message owner-message--error", role: "alert", children: loginError }), _jsx("button", { className: "button-primary", type: "submit", disabled: loginLoading, children: loginLoading ? "Signing in..." : t("ownerLogin") })] })] }) }));
    }
    return (_jsxs("section", { className: "owner-page", children: [_jsxs("div", { className: "owner-page__header", children: [_jsxs("div", { children: [_jsx("span", { className: "products-eyebrow", children: "Owner access" }), _jsx("h1", { children: "Product management" }), _jsx("p", { children: "Changes are saved to the catalog and appear on the public website." })] }), _jsx("button", { className: "button-secondary", type: "button", onClick: logout, children: "Sign out" })] }), error && _jsx("p", { className: "owner-message owner-message--error", role: "alert", children: error }), message && _jsx("p", { className: "owner-message", role: "status", children: message }), _jsxs("form", { className: "owner-form", onSubmit: saveProduct, children: [_jsxs("div", { className: "owner-form__heading", children: [_jsxs("div", { children: [_jsx("h2", { children: editing ? "Edit product" : "Add a product" }), _jsx("p", { children: "Images are optional; products without a photo use the site placeholder." })] }), editing && _jsx("button", { className: "button-secondary", type: "button", onClick: resetForm, children: "Cancel edit" })] }), _jsxs("div", { className: "owner-form__grid", children: [_jsxs("label", { children: ["Product name", _jsx("input", { required: true, minLength: 3, value: form.name, onChange: (event) => setForm({ ...form, name: event.target.value }) })] }), _jsxs("label", { children: ["Category", _jsxs("select", { required: true, value: form.categoryId, onChange: (event) => setForm({ ...form, categoryId: event.target.value }), children: [_jsx("option", { value: "", disabled: true, children: "Select a category" }), categories.map((category) => _jsx("option", { value: category.id, children: category.name }, category.id))] })] }), _jsxs("label", { children: ["Price (\u20B9)", _jsx("input", { type: "number", min: "0.01", step: "0.01", required: true, value: form.price, onChange: (event) => setForm({ ...form, price: event.target.value }) })] }), _jsxs("label", { children: ["Stock quantity", _jsx("input", { type: "number", min: "0", step: "1", required: true, value: form.stock, onChange: (event) => setForm({ ...form, stock: event.target.value }) })] }), _jsxs("label", { className: "owner-form__wide", children: ["Description", _jsx("textarea", { required: true, minLength: 10, rows: 4, value: form.description, onChange: (event) => setForm({ ...form, description: event.target.value }) })] }), _jsxs("label", { className: "owner-form__wide", children: ["Product image (JPG, PNG, WEBP \u00B7 max 5 MB)", _jsx("input", { type: "file", accept: "image/jpeg,image/png,image/webp", onChange: handleImageChange })] }), _jsxs("div", { className: "owner-form__preview", children: [_jsx(ProductImage, { src: imagePreview ?? "", alt: form.name || "Product image preview" }), _jsx("button", { className: "text-button", type: "button", onClick: () => {
                                            setSelectedImage(null);
                                            setForm((previous) => ({ ...previous, image: "" }));
                                            replaceImagePreview(null);
                                        }, children: "Remove image" })] }), _jsxs("fieldset", { className: "owner-form__options", children: [_jsx("legend", { children: "Product settings" }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: form.isAvailable, onChange: (event) => setForm({ ...form, isAvailable: event.target.checked }) }), " Available for ordering"] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: form.isFeatured, onChange: (event) => setForm({ ...form, isFeatured: event.target.checked }) }), " Featured product"] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: form.isVisible, onChange: (event) => setForm({ ...form, isVisible: event.target.checked }) }), " Visible in public catalog"] })] })] }), _jsx("div", { className: "owner-form__actions", children: _jsx("button", { className: "button-primary", type: "submit", disabled: saving || !categories.length, children: saving ? "Saving..." : editing ? "Save changes" : "Add product" }) })] }), _jsxs("section", { className: "owner-products", "aria-labelledby": "owner-products-title", children: [_jsxs("div", { className: "owner-form__heading", children: [_jsxs("div", { children: [_jsx("h2", { id: "owner-products-title", children: "Catalog products" }), _jsxs("p", { children: [products.length, " product", products.length === 1 ? "" : "s"] })] }), _jsx("button", { className: "button-secondary", type: "button", onClick: () => void loadData(), disabled: dataLoading, children: dataLoading ? "Loading..." : "Refresh" })] }), dataLoading && !products.length ? (_jsx("p", { role: "status", children: t("loading") })) : products.length ? (_jsx("div", { className: "owner-product-list", children: products.map((product) => (_jsxs("article", { className: "owner-product", children: [_jsx(ProductImage, { src: product.image, alt: product.name }), _jsxs("div", { className: "owner-product__details", children: [_jsx("span", { className: "product-card__category", children: product.category.name }), _jsx("h3", { children: product.name }), _jsxs("p", { children: ["\u20B9", product.price.toLocaleString("en-IN"), " \u00B7 ", product.stock, " in stock"] }), _jsxs("div", { className: "owner-product__tags", children: [_jsx("span", { className: "tag", children: product.isVisible ? "Visible" : "Hidden" }), _jsx("span", { className: "tag", children: product.isAvailable ? "Available" : "Unavailable" }), product.isFeatured && _jsx("span", { className: "tag", children: "Featured" })] })] }), _jsxs("div", { className: "owner-product__actions", children: [_jsx("button", { className: "button-secondary", type: "button", onClick: () => editProduct(product), children: "Edit" }), _jsx("button", { className: "button-danger", type: "button", onClick: () => void deleteProduct(product), children: "Delete" })] })] }, product.id))) })) : (_jsx("p", { className: "products-empty", children: "No products in the catalog yet." }))] })] }));
};
export default OwnerProductsPage;
