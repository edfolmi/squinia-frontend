import { AUTH_PATHS, getAuthApiBase } from "./auth-config";

export type ApiError = { ok: false; message: string };
export type ApiOk<T> = { ok: true; data: T };
export type ApiResult<T> = ApiOk<T> | ApiError;

function notConfigured(): ApiError {
  return { ok: false, message: "NEXT_PUBLIC_AUTH_API_BASE is not set." };
}

async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  const base = getAuthApiBase();
  if (!base) return notConfigured();
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const msg =
        typeof json.message === "string"
          ? json.message
          : typeof json.error === "string"
            ? json.error
            : res.statusText;
      return { ok: false, message: msg || "Request failed" };
    }
    return { ok: true, data: json as T };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error" };
  }
}

export type LoginBody = { email: string; password: string };
export type RegisterBody = { email: string; password: string; fullName: string };
export type VerifyEmailBody = { token: string };
export type ForgotPasswordBody = { email: string };
export type ResetPasswordBody = { token: string; password: string };
export type AcceptInviteBody = { token: string; password?: string; fullName?: string };

export function authApiConfigured(): boolean {
  return Boolean(getAuthApiBase());
}

export async function authLogin(body: LoginBody): Promise<ApiResult<unknown>> {
  return postJson(AUTH_PATHS.login, body);
}

export async function authRegister(body: RegisterBody): Promise<ApiResult<unknown>> {
  return postJson(AUTH_PATHS.register, body);
}

export async function authVerifyEmail(body: VerifyEmailBody): Promise<ApiResult<unknown>> {
  return postJson(AUTH_PATHS.verifyEmail, body);
}

export async function authForgotPassword(body: ForgotPasswordBody): Promise<ApiResult<unknown>> {
  return postJson(AUTH_PATHS.forgotPassword, body);
}

export async function authResetPassword(body: ResetPasswordBody): Promise<ApiResult<unknown>> {
  return postJson(AUTH_PATHS.resetPassword, body);
}

export async function authAcceptInvite(body: AcceptInviteBody): Promise<ApiResult<unknown>> {
  return postJson(AUTH_PATHS.acceptInvite, body);
}

export type OnboardingBody = {
  role: "student" | "admin";
  /** Student: selected goal ids */
  goalIds?: string[];
  /** Admin: first cohort */
  cohortName?: string;
  cohortDescription?: string;
};

export async function authCompleteOnboarding(body: OnboardingBody): Promise<ApiResult<unknown>> {
  return postJson(AUTH_PATHS.onboarding, body);
}
