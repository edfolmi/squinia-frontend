"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "squinia_settings_mock_org_admin" as const;
export const MOCK_ORG_ADMIN_CHANGED = "squinia-settings-admin-changed" as const;

export function useMockOrgAdmin(): boolean {
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    function read() {
      if (typeof window === "undefined") return;
      setAllowed(window.localStorage.getItem(STORAGE_KEY) !== "0");
    }
    read();
    window.addEventListener("storage", read);
    window.addEventListener(MOCK_ORG_ADMIN_CHANGED, read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener(MOCK_ORG_ADMIN_CHANGED, read);
    };
  }, []);

  return allowed;
}

export function OrgAdminGate({ children }: { children: React.ReactNode }) {
  const allowed = useMockOrgAdmin();

  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-6 text-[15px] leading-relaxed text-amber-950">
          <p className="font-semibold">Organization settings are admin-only.</p>
          <p className="mt-2 text-[14px] opacity-90">
            Your account does not have workspace admin access. Contact an owner to upgrade your role, or toggle the
            preview switch below to simulate an admin.
          </p>
        </div>
        <SimulateAdminToggle />
      </div>
    );
  }

  return <>{children}</>;
}

export function SimulateAdminToggle() {
  const allowed = useMockOrgAdmin();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--rule)] bg-[var(--surface)] px-4 py-3 text-[13px] text-[var(--muted)]">
      <input
        type="checkbox"
        checked={allowed}
        onChange={(e) => {
          window.localStorage.setItem(STORAGE_KEY, e.target.checked ? "1" : "0");
          window.dispatchEvent(new Event(MOCK_ORG_ADMIN_CHANGED));
        }}
        className="h-4 w-4 rounded border-[var(--rule-strong)]"
      />
      <span>Preview: simulate org admin (local only)</span>
    </label>
  );
}
