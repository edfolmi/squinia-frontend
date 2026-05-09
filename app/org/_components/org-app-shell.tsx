"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { SquiniaBrandLockup } from "@/app/_components/squinia-brand";
import { TenantSwitcher } from "@/app/_components/tenant-switcher";
import { brandingStyle } from "@/app/_lib/tenant-branding";
import { activeTenantBranding, defaultMembership, isOrgOperatorRole, useSession } from "@/app/_lib/use-session";
import { StudentProfileMenu } from "@/app/(student)/_components/student-profile-menu";

const NAV = [
  { href: "/org/cohorts", label: "Cohorts" },
  { href: "/org/scenarios", label: "Scenarios" },
  { href: "/org/personas", label: "Personas" },
  { href: "/org/rubrics", label: "Rubrics" },
  { href: "/org/assignments", label: "Assignments" },
  { href: "/org/analytics", label: "Analytics" },
  { href: "/org/settings", label: "Settings" },
] as const;

function navActive(href: string, pathname: string): boolean {
  switch (href) {
    case "/org/cohorts":
      return pathname === "/org/cohorts" || pathname.startsWith("/org/cohorts/");
    case "/org/scenarios":
      return pathname.startsWith("/org/scenarios");
    case "/org/personas":
      return pathname.startsWith("/org/personas");
    case "/org/rubrics":
      return pathname.startsWith("/org/rubrics");
    case "/org/assignments":
      return pathname.startsWith("/org/assignments");
    case "/org/analytics":
      return pathname === "/org/analytics";
    case "/org/settings":
      return pathname === "/org/settings" || pathname.startsWith("/org/settings/");
    default:
      return false;
  }
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = navActive(href, pathname);
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
        active
          ? "bg-[#0b2014] text-white shadow-[0_8px_20px_-16px_rgba(11,32,20,0.55)]"
          : "text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
      }`}
    >
      {label}
    </Link>
  );
}

export function OrgAppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading, reload } = useSession();
  const membership = defaultMembership(session);
  const branding = activeTenantBranding(session);
  const allowed = isOrgOperatorRole(session?.default_org_role);

  useEffect(() => {
    if (!loading && !allowed) router.replace("/dashboard");
  }, [allowed, loading, router]);

  if (loading || !allowed) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--background)] px-4 text-[14px] text-[var(--muted)]">
        Checking workspace access...
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--background)] text-[#111111] md:flex-row" style={brandingStyle(branding)}>
      <aside className="shrink-0 border-b border-[var(--rule)] bg-[linear-gradient(180deg,#ffffff_0%,#f6f8f2_100%)] md:w-64 md:border-b-0 md:border-r">
        <div className="flex flex-col gap-2 px-4 py-4 md:py-6">
          <SquiniaBrandLockup
            href="/org/cohorts"
            context="Operator"
            logoUrl={branding.logo_url}
            brandName={membership?.tenant_name ?? "Squinia"}
          />
          <p className="max-w-[12rem] text-[12px] leading-relaxed text-[var(--muted)]">
            Scenario intelligence for every cohort, coach, and team lead.
          </p>
          <Link
            href="/dashboard"
            className="mt-1 text-[12px] font-semibold text-[#0f6f34] underline-offset-4 hover:text-[#111111] hover:underline"
          >
            Student view
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:px-3 md:pb-6" aria-label="Organization">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-[var(--rule)] bg-[var(--surface)]/92 px-4 backdrop-blur-sm sm:px-6">
          <p className="truncate text-[14px] font-semibold tracking-[-0.02em] text-[#111111]">
            {membership?.tenant_name ?? "Operator dashboard"}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <TenantSwitcher session={session} onSwitched={reload} />
            <StudentProfileMenu />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
