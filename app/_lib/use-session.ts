"use client";

import { useCallback, useEffect, useState } from "react";

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
  joined_at: string;
};

export type SessionData = {
  user: SessionUser;
  memberships: SessionMembership[];
  default_tenant_id: string | null;
  default_org_role: string | null;
};

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<SessionData>("auth/me");
    if (res.ok) {
      setSession(res.data);
    } else {
      setError(res.message);
      setSession(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { session, loading, error, reload: load };
}
