const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 15000;

const extractErrorMessage = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string") return message;
  if (message && typeof message === "object") {
    const values = Object.values(message as Record<string, unknown>);
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

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string | null;
  body?: unknown;
  query?: URLSearchParams;
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = "GET", token, body, query } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const url = query ? `${API_BASE}${path}?${query.toString()}` : `${API_BASE}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please check backend server and network.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = extractErrorMessage(data) ?? "Request failed";
    throw new Error(message);
  }
  return data as T;
};

type MultipartMethod = "POST" | "PUT";

const multipartRequest = async <T>(
  path: string,
  formData: FormData,
  token?: string | null,
  method: MultipartMethod = "POST"
): Promise<T> => {
  const headers: Record<string, string> = {};
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: formData,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please check backend server and network.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = extractErrorMessage(data) ?? "Request failed";
    throw new Error(message);
  }
  return data as T;
};

export const adminApi = {
  get: <T>(path: string, token: string | null) => request<T>(path, { method: "GET", token }),
  post: <T>(path: string, body: unknown, token: string | null) => request<T>(path, { method: "POST", body, token }),
  put: <T>(path: string, body: unknown, token: string | null) => request<T>(path, { method: "PUT", body, token }),
  del: <T>(path: string, token: string | null) => request<T>(path, { method: "DELETE", token }),
  postMultipart: <T>(path: string, formData: FormData, token: string | null) =>
    multipartRequest<T>(path, formData, token, "POST"),
  putMultipart: <T>(path: string, formData: FormData, token: string | null) =>
    multipartRequest<T>(path, formData, token, "PUT"),
  uploadGallery: (formData: FormData, token: string | null) =>
    multipartRequest<{ urls: string[] }>("/api/admin/products/gallery", formData, token)
};
