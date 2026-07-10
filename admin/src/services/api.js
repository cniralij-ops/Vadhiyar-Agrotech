const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 15000;
const extractErrorMessage = (payload) => {
    if (!payload || typeof payload !== "object")
        return null;
    const message = payload.message;
    if (typeof message === "string")
        return message;
    if (message && typeof message === "object") {
        const values = Object.values(message);
        for (const value of values) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
                return value[0];
            }
            if (typeof value === "string") {
                return value;
            }
        }
    }
    return null;
};
const request = async (path, options = {}) => {
    const { method = "GET", token, body, query } = options;
    const headers = { "Content-Type": "application/json" };
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const url = query ? `${API_BASE}${path}?${query.toString()}` : `${API_BASE}${path}`;
    let response;
    try {
        response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal
        });
    }
    catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error("Request timed out. Please check backend server and network.");
        }
        throw error;
    }
    finally {
        window.clearTimeout(timeoutId);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = extractErrorMessage(data) ?? "Request failed";
        throw new Error(message);
    }
    return data;
};
const multipartRequest = async (path, formData, token, method = "POST") => {
    const headers = {};
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    let response;
    try {
        response = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            body: formData,
            signal: controller.signal
        });
    }
    catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error("Request timed out. Please check backend server and network.");
        }
        throw error;
    }
    finally {
        window.clearTimeout(timeoutId);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = extractErrorMessage(data) ?? "Request failed";
        throw new Error(message);
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
    uploadGallery: (formData, token) => multipartRequest("/api/admin/products/gallery", formData, token)
};
