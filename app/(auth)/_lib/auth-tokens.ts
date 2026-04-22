const ACCESS_KEY = "squinia_access_token";
const REFRESH_KEY = "squinia_refresh_token";

export type StoredAuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export function setAuthTokens(tokens: StoredAuthTokens): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
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
