const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const request = async (path, options = {}) => {
    const { method = "GET", token, body, query } = options;
    const headers = { "Content-Type": "application/json" };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const url = query ? `${API_BASE}${path}?${query.toString()}` : `${API_BASE}${path}`;
    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = data?.message || "Request failed";
        throw new Error(typeof message === "string" ? message : "Request failed");
    }
    return data;
};

const multipartRequest = async (path, formData, token, method = "POST") => {
    const headers = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: formData
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = data?.message || "Request failed";
        throw new Error(typeof message === "string" ? message : "Request failed");
    }
    return data;
};
export const adminApi = {
    get: (path, token) => request(path, { method: "GET", token }),
    post: (path, body, token) => request(path, { method: "POST", body, token }),
    put: (path, body, token) => request(path, { method: "PUT", body, token }),
    del: (path, token) => request(path, { method: "DELETE", token }),
    postMultipart: (path, formData, token) => multipartRequest(path, formData, token, "POST"),
    putMultipart: (path, formData, token) => multipartRequest(path, formData, token, "PUT"),
    uploadGallery: (formData, token) => multipartRequest("/api/admin/products/gallery", formData, token, "POST")
};
