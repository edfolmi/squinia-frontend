"use client";

import { useSession } from "@/app/_lib/use-session";

const ORG_ROLES = new Set(["ORG_OWNER", "ORG_ADMIN", "INSTRUCTOR"]);

export function useIsOrgAdmin(): { isAdmin: boolean; loading: boolean } {
  const { session, loading } = useSession();
  const isAdmin = !loading && session != null && ORG_ROLES.has(session.default_org_role ?? "");
  return { isAdmin, loading };
}

export function OrgAdminGate({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useIsOrgAdmin();

  if (loading) {
    return <p className="text-[14px] text-[var(--muted)]">Checking permissions…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-6 text-[15px] leading-relaxed text-amber-950">
          <p className="font-semibold">Organization settings are admin-only.</p>
          <p className="mt-2 text-[14px] opacity-90">
            Your account does not have workspace admin access. Contact an owner to upgrade your role.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
