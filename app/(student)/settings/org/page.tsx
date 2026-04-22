"use client";

import { useSession } from "@/app/_lib/use-session";
import { v1 } from "@/app/_lib/v1-client";
import { useCallback, useEffect, useState } from "react";

import { OrgAdminGate } from "../_components/org-admin-gate";
import { OrgSettingsForm } from "./org-settings-form";

type TenantData = { id: string; name: string; slug: string; plan: string; is_active: boolean };

export default function SettingsOrgPage() {
  const { session, loading: sessionLoading } = useSession();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.default_tenant_id) { setLoading(false); return; }
    setLoading(true);
    const res = await v1.get<{ tenant: TenantData }>(`tenants/${session.default_tenant_id}`);
    if (res.ok) setTenant(res.data.tenant);
    setLoading(false);
  }, [session?.default_tenant_id]);

  useEffect(() => {
    if (!sessionLoading) void load();
  }, [sessionLoading, load]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Organization</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Workspace name and plan summary.
        </p>
      </div>
      <OrgAdminGate>
        {loading || sessionLoading ? (
          <p className="text-[14px] text-[var(--muted)]">Loading…</p>
        ) : tenant ? (
          <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
            <OrgSettingsForm
              initial={{
                name: tenant.name,
                slug: tenant.slug,
                planName: tenant.plan ?? "Free",
              }}
            />
          </section>
        ) : (
          <p className="text-[14px] text-[var(--muted)]">No organization found.</p>
        )}
      </OrgAdminGate>
    </div>
  );
}
