const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string | null;
  body?: unknown;
  query?: URLSearchParams;
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const url = `${API_BASE}${path}`;
  const { method = "GET", token, body, query } = options;
  const headers: Record<string, string> = {
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
    const message = (data as any)?.message || "Request failed";
    throw new Error(typeof message === "string" ? message : "Request failed");
  }
  return data as T;
};

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { method: "GET", token }),
  post: <T>(path: string, body: unknown, token?: string | null) => request<T>(path, { method: "POST", body, token }),
  put: <T>(path: string, body: unknown, token?: string | null) => request<T>(path, { method: "PUT", body, token }),
  del: <T>(path: string, token?: string | null) => request<T>(path, { method: "DELETE", token })
};
