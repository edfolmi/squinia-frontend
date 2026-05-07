"use client";

import { useSession } from "@/app/_lib/use-session";

import { OrgAdminGate } from "../_components/org-admin-gate";
import { MembersSettingsPanel } from "./members-settings-panel";

export default function SettingsMembersPage() {
  const { session, loading } = useSession();

  const tenantId = session?.default_tenant_id ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Staff</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Invite team members and manage organization dashboard access.
        </p>
      </div>
      <OrgAdminGate>
        {loading ? (
          <p className="text-[14px] text-[var(--muted)]">Loading…</p>
        ) : (
          <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
            <MembersSettingsPanel tenantId={tenantId} />
          </section>
        )}
      </OrgAdminGate>
    </div>
  );
}
