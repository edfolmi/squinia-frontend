"use client";

import { useCallback, useEffect, useState } from "react";

import { getAccessToken } from "@/app/(auth)/_lib/auth-tokens";

import { v1 } from "./v1-client";

export type SessionUser = {
  id: string;
  email: string;
  full_name: string | null;
  platform_role: string;
  is_active: boolean;
  is_verified: boolean;
  onboarding_completed_at: string | null;
};

export type SessionMembership = {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  org_role: string;
  account_kind?: string;
  joined_at: string;
  branding?: TenantBranding;
};

export type TenantBranding = {
  logo_url?: string | null;
  primary_color?: string | null;
};

export type SessionData = {
  user: SessionUser;
  memberships: SessionMembership[];
  default_tenant_id: string | null;
  default_org_role: string | null;
};

const SESSION_SNAPSHOT_KEY = "squinia_session_snapshot";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSessionData(value: unknown): value is SessionData {
  if (!isRecord(value)) return false;
  const user = value.user;
  return isRecord(user) && typeof user.id === "string" && Array.isArray(value.memberships);
}

function readCachedSession(): SessionData | null {
  if (typeof window === "undefined" || !getAccessToken()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isSessionData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedSession(session: SessionData | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_SNAPSHOT_KEY);
    }
  } catch {
    /* Storage can be unavailable in private contexts; the live session still works. */
  }
}

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const cached = readCachedSession();
    if (cached) setSession(cached);
    const res = await v1.get<SessionData>("auth/me");
    if (res.ok) {
      setSession(res.data);
      writeCachedSession(res.data);
    } else {
      setError(res.message);
      setSession(null);
      writeCachedSession(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return { session, loading, error, reload: load };
}

export function defaultMembership(session: SessionData | null): SessionMembership | null {
  if (!session?.default_tenant_id) return null;
  return session.memberships.find((m) => m.tenant_id === session.default_tenant_id) ?? null;
}

export function activeTenantBranding(session: SessionData | null): TenantBranding {
  return defaultMembership(session)?.branding ?? {};
}

export function isOrgOperatorRole(role: string | null | undefined): boolean {
  return role === "ORG_OWNER" || role === "ORG_ADMIN" || role === "INSTRUCTOR";
}
