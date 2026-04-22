import { getApiBase } from "@/app/(auth)/_lib/auth-config";
import { getAccessToken } from "@/app/(auth)/_lib/auth-tokens";

import { parseApiJson, type ApiResult } from "./api-envelope";

const API_PREFIX = "/api/v1";

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
  /** When false, do not send Bearer (rare; most v1 routes require auth). */
  auth?: boolean;
};

export async function v1Request<T>(method: string, path: string, options?: V1RequestOptions): Promise<ApiResult<T>> {
  const base = getApiBase();
  if (!base) {
    return { ok: false, message: "Set NEXT_PUBLIC_API_BASE to your API origin (e.g. http://localhost:8000)." };
  }

  const useAuth = options?.auth !== false;
  const token = useAuth ? getAccessToken() : null;
  if (useAuth && !token) {
    return { ok: false, message: "Sign in required — no access token in storage." };
  }

  // Resolve absolute URL so a bad base never becomes a same-origin relative ``/api/v1/...`` hit on Next.js.
  let url: string;
  try {
    const origin = base.replace(/\/+$/, "");
    const pathPart = path.startsWith("/") ? path : `/${path}`;
    url = new URL(`${pathPart.replace(/^\//, "")}${toQuery(options?.query)}`, `${origin}/`).href;
  } catch {
    return { ok: false, message: `Invalid API base URL: ${base}` };
  }
  while (url.includes("/api/v1/api/v1")) {
    url = url.replace("/api/v1/api/v1", "/api/v1");
  }
  if (typeof window !== "undefined") {
    try {
      const u = new URL(url);
      if (u.origin === window.location.origin) {
        return {
          ok: false,
          message:
            "NEXT_PUBLIC_API_BASE points at this Next.js origin, so /api/v1 calls never reach FastAPI. Set it to the API host (e.g. http://localhost:8000).",
        };
      }
    } catch {
      /* ignore */
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
    if (!out.ok && res.status === 422 && "message" in out) {
      return { ...out, message: `${out.message} (request URL: ${url})` };
    }
    return out;
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error" };
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

/** Paginated list bodies use ``data: { items: T[] }`` with totals on ``meta.pagination`` (optional). */
export type ItemsData<T> = { items: T[] };
