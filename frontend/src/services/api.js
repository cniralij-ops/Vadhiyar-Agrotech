const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const request = async (path, options = {}) => {
    const url = `${API_BASE}${path}`;
    const { method = "GET", token, body, query } = options;
    const headers = {
        "Content-Type": "application/json"
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const finalUrl = query ? `${url}?${query.toString()}` : url;
    const response = await fetch(finalUrl, {
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
export const api = {
    get: (path, token) => request(path, { method: "GET", token }),
    post: (path, body, token) => request(path, { method: "POST", body, token }),
    put: (path, body, token) => request(path, { method: "PUT", body, token }),
    del: (path, token) => request(path, { method: "DELETE", token })
};
