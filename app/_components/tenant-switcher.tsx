"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authSwitchTenant } from "@/app/(auth)/_lib/auth-api";
import { isOrgOperatorRole, type SessionData } from "@/app/_lib/use-session";

type Props = {
  session: SessionData | null;
  onSwitched?: () => Promise<void> | void;
};

export function TenantSwitcher({ session, onSwitched }: Props) {
  const router = useRouter();
  const memberships = session?.memberships ?? [];
  const activeTenantId = session?.default_tenant_id ?? "";
  const [pendingTenantId, setPendingTenantId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (memberships.length <= 1) return null;

  async function switchTo(tenantId: string) {
    if (!tenantId || tenantId === activeTenantId || busy) return;
    setPendingTenantId(tenantId);
    setBusy(true);
    setError(null);
    const res = await authSwitchTenant(tenantId);
    if (!res.ok) {
      setError(res.message);
      setPendingTenantId("");
      setBusy(false);
      return;
    }
    const selected = memberships.find((m) => m.tenant_id === tenantId);
    await onSwitched?.();
    router.push(isOrgOperatorRole(selected?.org_role) ? "/org/cohorts" : "/dashboard");
    router.refresh();
    setPendingTenantId("");
    setBusy(false);
  }

  return (
    <div className="min-w-0">
      <label className="sr-only" htmlFor="tenant-switcher">
        Switch organization
      </label>
      <select
        id="tenant-switcher"
        value={pendingTenantId || activeTenantId}
        disabled={busy}
        onChange={(event) => void switchTo(event.target.value)}
        className="max-w-[15rem] rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-3 py-2 text-[13px] font-semibold text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)] disabled:opacity-60"
      >
        {memberships.map((membership) => (
          <option key={membership.tenant_id} value={membership.tenant_id}>
            {membership.tenant_name}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 max-w-[15rem] text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}
