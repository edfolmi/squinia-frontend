import { AUTH_PATHS, getApiBase } from "./auth-config";
import { getAccessToken, getRefreshToken, setAuthTokens, setSessionFromLoginData } from "./auth-tokens";

export type ApiError = { ok: false; message: string };
export type ApiOk<T> = { ok: true; data: T };
export type ApiResult<T> = ApiOk<T> | ApiError;

function notConfigured(): ApiError {
  return {
    ok: false,
    message: "Set NEXT_PUBLIC_API_BASE to your backend origin (e.g. http://localhost:8000).",
  };
}

function extractApiErrorMessage(json: Record<string, unknown>, fallback: string): string {
  const err = json.error;
  if (err && typeof err === "object" && err !== null) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.length > 0) return msg;
  }
  if (typeof json.message === "string" && json.message.length > 0) return json.message;
  if (typeof json.detail === "string") return json.detail;
  if (Array.isArray(json.detail)) {
    const first = json.detail[0] as { msg?: unknown } | undefined;
    if (first && typeof first.msg === "string") return first.msg;
  }
  return fallback || "Request failed";
}

async function parseJsonResponse<T>(res: Response): Promise<ApiResult<T>> {
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    return { ok: false, message: extractApiErrorMessage(json, res.statusText) };
  }

  if (json.success === true && "data" in json) {
    return { ok: true, data: json.data as T };
  }

  return { ok: false, message: extractApiErrorMessage(json, "Unexpected response from API") };
}

type PostJsonOptions = { bearer?: boolean };

async function getJson<T>(path: string, options?: PostJsonOptions): Promise<ApiResult<T>> {
  const base = getApiBase();
  if (!base) return notConfigured();

  const headers: Record<string, string> = {};
  if (options?.bearer !== false) {
    const access = getAccessToken();
    if (!access) {
      return { ok: false, message: "You need to be signed in first (missing access token)." };
    }
    headers.Authorization = `Bearer ${access}`;
  }

  try {
    const res = await fetch(`${base}${path}`, {
      method: "GET",
      headers,
      credentials: "include",
    });
    return parseJsonResponse<T>(res);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error" };
  }
}

async function postJson<T>(path: string, body: unknown, options?: PostJsonOptions): Promise<ApiResult<T>> {
  const base = getApiBase();
  if (!base) return notConfigured();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options?.bearer) {
    const access = getAccessToken();
    if (!access) {
      return { ok: false, message: "You need to be signed in first (missing access token)." };
    }
    headers.Authorization = `Bearer ${access}`;
  }

  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      credentials: "include",
    });
    return parseJsonResponse<T>(res);
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
  return Boolean(getApiBase());
}

/** One row from ``GET /auth/me`` ``memberships`` (shape matches backend ``MeMembershipItem``). */
export type AuthMeMembership = {
  tenant_id?: string;
  tenant_name?: string;
  tenant_slug?: string;
  org_role?: string;
  joined_at?: string;
};

/** ``GET /api/v1/auth/me`` — call after tokens are stored (login, refresh, onboarding). */
export type AuthMeResponse = {
  user: {
    onboarding_completed_at?: string | null;
    [key: string]: unknown;
  };
  memberships: AuthMeMembership[];
  default_tenant_id?: string | null;
  default_org_role?: string | null;
};

export async function authFetchMe(): Promise<ApiResult<AuthMeResponse>> {
  return getJson<AuthMeResponse>(AUTH_PATHS.me, { bearer: true });
}

/** Matches bootstrap tenant name from ``ensure_personal_workspace`` (``"{name}'s workspace"``). */
function isPersonalWorkspaceTenant(m: AuthMeMembership | undefined): boolean {
  const n = m?.tenant_name;
  return typeof n === "string" && /'s workspace$/u.test(n);
}

/**
 * Where to send the user right after auth tokens are saved.
 * Uses ``/auth/me``: onboarding until ``onboarding_completed_at``; then org vs learner shell.
 * Self-serve signups get a lone personal workspace first — they still see onboarding until it is completed.
 */
export function postAuthDestination(me: AuthMeResponse | null): string {
  if (!me) {
    return "/dashboard";
  }

  const completed = Boolean(me.user?.onboarding_completed_at);
  const ms = Array.isArray(me.memberships) ? me.memberships : [];
  const hasMembership = ms.length > 0;
  const role = me.default_org_role;
  const isOrg = role === "ORG_OWNER" || role === "ORG_ADMIN" || role === "INSTRUCTOR";

  // Invites (or any non-bootstrap-only tenant) already belong to a real org before ``onboarding_completed_at`` is set.
  if (!completed && hasMembership) {
    const onlyPersonalBootstrap = ms.length === 1 && isPersonalWorkspaceTenant(ms[0]);
    if (!onlyPersonalBootstrap) {
      return isOrg ? "/org/cohorts" : "/dashboard";
    }
  }

  if (!completed) {
    return isOrg ? "/onboarding?role=admin" : "/onboarding";
  }

  if (isOrg) {
    return "/org/cohorts";
  }
  return "/dashboard";
}

export async function authLogin(body: LoginBody): Promise<ApiResult<unknown>> {
  return postJson(AUTH_PATHS.login, body);
}

export async function authRegister(body: RegisterBody): Promise<ApiResult<unknown>> {
  return postJson(AUTH_PATHS.register, {
    email: body.email,
    password: body.password,
    full_name: body.fullName,
  });
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
  return postJson(AUTH_PATHS.acceptInvite, {
    token: body.token,
    password: body.password ?? null,
    full_name: body.fullName?.trim() ? body.fullName.trim() : null,
  });
}

export type OnboardingBody = {
  role: "student" | "admin";
  goalIds?: string[];
  cohortName?: string;
  cohortDescription?: string;
  /** Sent with admin onboarding; sets cohort schedule on the backend. */
  programLengthWeeks?: number;
};

export async function authCompleteOnboarding(body: OnboardingBody): Promise<ApiResult<unknown>> {
  const res = await postJson<Record<string, unknown>>(AUTH_PATHS.onboarding, body, { bearer: true });
  if (res.ok && res.data) {
    setSessionFromLoginData(res.data);
  }
  return res;
}

/** Rotate tokens; on success updates stored refresh/access tokens. */
export async function authRefreshSession(): Promise<ApiResult<{ tokens: unknown }>> {
  const refresh = getRefreshToken();
  if (!refresh) {
    return { ok: false, message: "No refresh token in storage." };
  }
  const res = await postJson<{ tokens: { access_token: string; refresh_token: string; token_type?: string } }>(
    AUTH_PATHS.refresh,
    { refresh_token: refresh },
  );
  if (res.ok && res.data && typeof res.data === "object" && res.data !== null) {
    const tokens = (res.data as { tokens?: unknown }).tokens;
    if (tokens && typeof tokens === "object" && tokens !== null) {
      const t = tokens as Record<string, unknown>;
      if (typeof t.access_token === "string" && typeof t.refresh_token === "string") {
        setAuthTokens({
          access_token: t.access_token,
          refresh_token: t.refresh_token,
          token_type: typeof t.token_type === "string" ? t.token_type : "bearer",
        });
      }
    }
  }
  return res as ApiResult<{ tokens: unknown }>;
}

export { setSessionFromLoginData };
