import { getApiBase } from "@/app/(auth)/_lib/auth-config";
import { loginRedirectPath } from "@/app/(auth)/_lib/auth-redirect.mjs";
import { clearAuthTokens, getAccessToken } from "@/app/(auth)/_lib/auth-tokens";

import { parseApiJson, type ApiResult } from "./api-envelope";

const API_PREFIX = "/api/v1";

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  clearAuthTokens();
  const current = `${window.location.pathname}${window.location.search}`;
  window.location.assign(loginRedirectPath(current));
}

function serviceUnavailableMessage(): string {
  return "We could not reach Squinia services. Please refresh the page or try again in a moment.";
}

function requestFailedMessage(e: unknown): string {
  if (e instanceof DOMException && e.name === "AbortError") {
    return "Request timed out. Check your connection and try again.";
  }
  return "We could not complete that request. Please try again.";
}

function toQuery(query?: Record<string, string | number | boolean | undefined | null>): string {
  if (!query) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export type V1RequestOptions = {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** When false, do not send Bearer. Most v1 routes require auth. */
  auth?: boolean;
};

export async function v1Request<T>(method: string, path: string, options?: V1RequestOptions): Promise<ApiResult<T>> {
  const base = getApiBase();
  if (!base) {
    return { ok: false, message: serviceUnavailableMessage() };
  }

  const useAuth = options?.auth !== false;
  const token = useAuth ? getAccessToken() : null;
  if (useAuth && !token) {
    redirectToLogin();
    return { ok: false, message: "Your session has ended. Please sign in again." };
  }

  let url: string;
  try {
    const origin = base.replace(/\/+$/, "");
    const pathPart = path.startsWith("/") ? path : `/${path}`;
    url = new URL(`${pathPart.replace(/^\//, "")}${toQuery(options?.query)}`, `${origin}/`).href;
  } catch {
    return { ok: false, message: serviceUnavailableMessage() };
  }

  while (url.includes("/api/v1/api/v1")) {
    url = url.replace("/api/v1/api/v1", "/api/v1");
  }

  if (typeof window !== "undefined") {
    try {
      const u = new URL(url);
      if (u.origin === window.location.origin) {
        return { ok: false, message: serviceUnavailableMessage() };
      }
    } catch {
      /* keep the customer-facing message below */
    }
  }

  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  if (options?.body !== undefined) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "include",
    });
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const out = parseApiJson<T>(res, raw);
    if (!res.ok && res.status === 401 && useAuth) {
      redirectToLogin();
    }
    return out;
  } catch (e) {
    return { ok: false, message: requestFailedMessage(e) };
  }
}

export function v1Path(segment: string): string {
  return `${API_PREFIX}${segment.startsWith("/") ? segment : `/${segment}`}`;
}

export const v1 = {
  get: <T>(path: string, query?: V1RequestOptions["query"]) =>
    v1Request<T>("GET", path.startsWith("/api/") ? path : v1Path(path), { query }),
  post: <T>(path: string, body?: unknown, query?: V1RequestOptions["query"]) =>
    v1Request<T>("POST", path.startsWith("/api/") ? path : v1Path(path), { body, query }),
  patch: <T>(path: string, body?: unknown) =>
    v1Request<T>("PATCH", path.startsWith("/api/") ? path : v1Path(path), { body }),
  delete: <T>(path: string) => v1Request<T>("DELETE", path.startsWith("/api/") ? path : v1Path(path)),
};

export type ItemsData<T> = { items: T[] };
