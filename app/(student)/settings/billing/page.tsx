"use client";

import { useCallback, useEffect, useState } from "react";

import { useSession } from "@/app/_lib/use-session";
import { v1 } from "@/app/_lib/v1-client";

import { OrgAdminGate } from "../_components/org-admin-gate";
import { BillingStubPanel } from "./billing-stub-panel";

type TenantData = { id: string; name: string; slug: string; plan: string; is_active: boolean };

export default function SettingsBillingPage() {
  const { session, loading: sessionLoading } = useSession();
  const tenantId = session?.default_tenant_id ?? null;
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    const res = await v1.get<{ tenant: TenantData }>(`tenants/${tenantId}`);
    if (res.ok) setTenant(res.data.tenant);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    if (!sessionLoading) void Promise.resolve().then(load);
  }, [sessionLoading, load]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Billing</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Plan and seat usage overview.
        </p>
      </div>
      <OrgAdminGate>
        {loading || sessionLoading ? (
          <p className="text-[14px] text-[var(--muted)]">Loading…</p>
        ) : (
          <BillingStubPanel
            org={{
              planName: tenant?.plan ?? "Free",
              billingEmail: session?.user?.email ?? "",
            }}
          />
        )}
      </OrgAdminGate>
    </div>
  );
}
