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
  const formDataBody = typeof FormData !== "undefined" && body instanceof FormData ? body : undefined;
  const headers: Record<string, string> = {};
  if (!formDataBody) headers["Content-Type"] = "application/json";
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const finalUrl = query ? `${url}?${query.toString()}` : url;
  const requestBody: BodyInit | undefined = formDataBody
    ? formDataBody
    : typeof body === "undefined"
      ? undefined
      : JSON.stringify(body);
  let response: Response;
  try {
    response = await fetch(finalUrl, {
      method,
      headers,
      body: requestBody
    });
  } catch {
    throw new Error(`Unable to reach the backend at ${API_BASE}. Check the backend service and VITE_API_URL.`);
  }
  const responseText = await response.text();
  let data: unknown = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
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
  return data as T;
};

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { method: "GET", token }),
  post: <T>(path: string, body: unknown, token?: string | null) => request<T>(path, { method: "POST", body, token }),
  put: <T>(path: string, body: unknown, token?: string | null) => request<T>(path, { method: "PUT", body, token }),
  del: <T>(path: string, token?: string | null) => request<T>(path, { method: "DELETE", token })
};
