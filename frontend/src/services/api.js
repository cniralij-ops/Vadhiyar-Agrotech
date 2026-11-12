const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const request = async (path, options = {}) => {
    const url = `${API_BASE}${path}`;
    const { method = "GET", token, body, query } = options;
    const formDataBody = typeof FormData !== "undefined" && body instanceof FormData ? body : undefined;
    const headers = {};
    if (!formDataBody)
        headers["Content-Type"] = "application/json";
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const finalUrl = query ? `${url}?${query.toString()}` : url;
    const requestBody = formDataBody
        ? formDataBody
        : typeof body === "undefined"
            ? undefined
            : JSON.stringify(body);
    let response;
    try {
        response = await fetch(finalUrl, {
            method,
            headers,
            body: requestBody
        });
    }
    catch {
        throw new Error(`Unable to reach the backend at ${API_BASE}. Check the backend service and VITE_API_URL.`);
    }
    const responseText = await response.text();
    let data = {};
    if (responseText) {
        try {
            data = JSON.parse(responseText);
        }
        catch {
            data = {};
        }
    }
    if (!response.ok) {
        const message = typeof data === "object" && data !== null && "message" in data
            ? data.message
            : undefined;
        throw new Error(typeof message === "string" && message
            ? `${message} (HTTP ${response.status})`
            : `Request failed (HTTP ${response.status} ${response.statusText}).`);
    }
    return data;
};
export const api = {
    get: (path, token) => request(path, { method: "GET", token }),
    post: (path, body, token) => request(path, { method: "POST", body, token }),
    put: (path, body, token) => request(path, { method: "PUT", body, token }),
    del: (path, token) => request(path, { method: "DELETE", token })
};
