const DEFAULT_API_BASE_URL = "http://localhost:8000";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export type ApiRequestOptions<TBody = unknown> = {
  method?: string;
  body?: TBody;
  headers?: HeadersInit;
  query?: Record<string, string | number | boolean | null | undefined>;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  keepalive?: boolean;
  authToken?: string;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path: string, query?: ApiRequestOptions["query"]): string {
  const base = path.startsWith("http") ? "" : API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") || path.startsWith("http")
    ? path
    : `/${path}`;
  const url = `${base}${normalizedPath}`;

  if (!query || Object.keys(query).length === 0) {
    return url;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) {
      continue;
    }
    params.append(key, String(value));
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${params.toString()}`;
}

function isBodyJson(body: unknown): boolean {
  if (body === null || body === undefined) {
    return false;
  }
  return !(body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob ||body instanceof ArrayBuffer);
}

function buildRequestHeaders(
  headers: HeadersInit | undefined,
  authToken: string | undefined,
  body: unknown
): Headers {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
 
  if (authToken) {
    requestHeaders.set("Authorization", `Bearer ${authToken}`);
  }
 
  if (body !== undefined && isBodyJson(body)) {
    requestHeaders.set("Content-Type", "application/json");
  }
 
  return requestHeaders;
}

function buildRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }
 
  if (isBodyJson(body)) {
    return JSON.stringify(body);
  }
 
  return body as BodyInit;
}

function parseEmptyResponse<TResponse>(response: Response): TResponse {
  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status, null);
  }
  return undefined as TResponse;
}

async function parseResponseData(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
 
  if (!isJson) {
    return response.text();
  }
 
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function throwApiError(response: Response, data: unknown): never {
  const detail = (data as { detail?: unknown } | null)?.detail;

  if (response.status === 401) {
    const message = "Your session has expired due to inactivity. Redirecting to login...";
    window.dispatchEvent(new CustomEvent("session-expired", { detail: { message } }));
    setTimeout(() => {
      localStorage.removeItem("aegis_token");
      localStorage.removeItem("aegis_role");
      window.location.href = "/auth?mode=login";
    }, 1200);
  }

  const message =
    detail && typeof detail === "string"
      ? detail
      : Array.isArray(detail)
      ? "Validation error — check your input"
      : `Request failed with status ${response.status}`;

  throw new ApiError(message, response.status, data);
}
 
export async function apiFetch<TResponse>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const {
    method = "GET",
    body,
    headers,
    query,
    credentials,
    signal,
    keepalive,
    authToken,
  } = options;
 
  const requestHeaders = buildRequestHeaders(headers, authToken, body);
  const requestBody = buildRequestBody(body);
 
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: requestBody,
    credentials,
    signal,
    keepalive,
  });
 
  if (response.status === 204 || response.status === 205) {
    return parseEmptyResponse<TResponse>(response);
  }
 
  const data = await parseResponseData(response);
 
  if (!response.ok) {
    throwApiError(response, data);
  }
 
  return data as TResponse;
}

export function apiGet<TResponse>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  return apiFetch<TResponse>(path, { ...options, method: "GET" });
}

export function apiPost<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  options: ApiRequestOptions<TBody> = {}
): Promise<TResponse> {
  return apiFetch<TResponse>(path, { ...options, method: "POST", body });
}

export function apiPut<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  options: ApiRequestOptions<TBody> = {}
): Promise<TResponse> {
  return apiFetch<TResponse>(path, { ...options, method: "PUT", body });
}

export function apiPatch<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  options: ApiRequestOptions<TBody> = {}
): Promise<TResponse> {
  return apiFetch<TResponse>(path, { ...options, method: "PATCH", body });
}

export function apiDelete<TResponse>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  return apiFetch<TResponse>(path, { ...options, method: "DELETE" });
}