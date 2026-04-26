import { isJwtExpired, sessionCookieMaxAgeSeconds } from "./auth-token-expiry.mjs";

const ACCESS_KEY = "squinia_access_token";
const REFRESH_KEY = "squinia_refresh_token";

/** Non-httpOnly flag so Edge middleware can gate HTML routes; real auth is still the Bearer token in localStorage. */
export const AUTH_SESSION_COOKIE = "squinia_session";

function sessionCookieSuffix(accessToken?: string): string {
  const maxAge = accessToken ? sessionCookieMaxAgeSeconds(accessToken) : 604800;
  if (typeof window === "undefined") return `Path=/; SameSite=Lax; Max-Age=${maxAge}`;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  return `Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function setSessionPresenceCookie(accessToken?: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_SESSION_COOKIE}=1; ${sessionCookieSuffix(accessToken)}`;
}

function clearSessionPresenceCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** Call on auth pages when a token exists so middleware sees the session cookie (e.g. after upgrading from LS-only). */
export function ensureAuthSessionCookie(): void {
  if (typeof window === "undefined") return;
  const token = getAccessToken();
  if (token) setSessionPresenceCookie(token);
}

export type StoredAuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export function setAuthTokens(tokens: StoredAuthTokens): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  setSessionPresenceCookie(tokens.access_token);
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  clearSessionPresenceCookie();
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(ACCESS_KEY);
  if (token && isJwtExpired(token)) {
    clearAuthTokens();
    return null;
  }
  return token;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

/** Persist JWTs from a successful `POST /api/v1/auth/login` (or register + login) payload `data`. */
export function setSessionFromLoginData(data: unknown): void {
  if (!data || typeof data !== "object") return;
  const tokens = (data as { tokens?: unknown }).tokens;
  if (!tokens || typeof tokens !== "object") return;
  const t = tokens as Record<string, unknown>;
  const access = t.access_token;
  const refresh = t.refresh_token;
  if (typeof access === "string" && typeof refresh === "string") {
    setAuthTokens({
      access_token: access,
      refresh_token: refresh,
      token_type: typeof t.token_type === "string" ? t.token_type : "bearer",
    });
  }
}
