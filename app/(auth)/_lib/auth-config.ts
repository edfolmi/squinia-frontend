/**
 * Point `NEXT_PUBLIC_AUTH_API_BASE` at your auth service (no trailing slash), e.g.
 * `https://api.example.com` — paths below are appended.
 * Leave unset for UI-only preview; forms still validate locally.
 */
export function getAuthApiBase(): string {
  return (process.env.NEXT_PUBLIC_AUTH_API_BASE ?? "").replace(/\/$/, "");
}

export const AUTH_PATHS = {
  login: "/auth/login",
  register: "/auth/register",
  verifyEmail: "/auth/verify-email",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  acceptInvite: "/auth/accept-invite",
  onboarding: "/auth/onboarding",
} as const;
