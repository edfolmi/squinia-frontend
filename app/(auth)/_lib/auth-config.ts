/**
 * Backend origin (no trailing slash), e.g. `http://localhost:8000` or `https://api.example.com`.
 * Auth routes are `GET|POST ${API_BASE}/api/v1/auth/...` per `openapi.json`.
 *
 * Set `NEXT_PUBLIC_API_BASE`. For older setups, `NEXT_PUBLIC_AUTH_API_BASE` is still read as the origin.
 * In development, defaults to `http://localhost:8000` when neither env var is set.
 */
export function getApiBase(): string {
  const explicit = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/$/, "");
  if (explicit) return explicit;
  const legacy = (process.env.NEXT_PUBLIC_AUTH_API_BASE ?? "").replace(/\/$/, "");
  if (legacy) return legacy;
  if (process.env.NODE_ENV === "development") return "http://localhost:8000";
  return "";
}

/** @deprecated Use getApiBase — kept for call sites that only check configuration. */
export function getAuthApiBase(): string {
  return getApiBase();
}

const API_V1 = "/api/v1";

export const AUTH_PATHS = {
  login: `${API_V1}/auth/login`,
  register: `${API_V1}/auth/register`,
  refresh: `${API_V1}/auth/refresh`,
  me: `${API_V1}/auth/me`,
  verifyEmail: `${API_V1}/auth/verify-email`,
  forgotPassword: `${API_V1}/auth/forgot-password`,
  resetPassword: `${API_V1}/auth/reset-password`,
  acceptInvite: `${API_V1}/auth/accept-invite`,
  onboarding: `${API_V1}/auth/onboarding`,
} as const;
