"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SquiniaBrandLockup } from "@/app/_components/squinia-brand";
import { TenantSwitcher } from "@/app/_components/tenant-switcher";
import { brandingStyle } from "@/app/_lib/tenant-branding";
import { activeTenantBranding, defaultMembership, isOrgOperatorRole, useSession } from "@/app/_lib/use-session";
import { StudentProfileMenu } from "@/app/(student)/_components/student-profile-menu";

const NAV_BEFORE = [{ href: "/org/cohorts", label: "Cohorts" }] as const;

const SCENARIO_STUDIO_NAV = [
  { href: "/org/scenarios", label: "Scenarios" },
  { href: "/org/personas", label: "Personas" },
  { href: "/org/rubrics", label: "Rubric Boards" },
] as const;

const NAV_AFTER = [
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
      className={`sim-transition rounded-xl px-3 py-2.5 text-[13px] font-medium ${
        active
          ? "bg-[var(--surface-strong)] text-white shadow-[0_16px_34px_-24px_rgba(16,23,17,0.75)]"
          : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </Link>
  );
}

function ScenarioStudioNav() {
  const pathname = usePathname();
  const hasActiveChild = SCENARIO_STUDIO_NAV.some((item) => navActive(item.href, pathname));
  const [expanded, setExpanded] = useState(false);
  const open = expanded || hasActiveChild;

  return (
    <div className="flex shrink-0 flex-col">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setExpanded((value) => !value)}
        className={`sim-transition flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium ${
          hasActiveChild
            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
            : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
        }`}
      >
        <span aria-hidden className={`text-[10px] transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          ▶
        </span>
        <span>Scenario Studio</span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className={`mt-1 flex flex-col gap-1 pl-5 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}>
            {SCENARIO_STUDIO_NAV.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </div>
        </div>
      </div>
    </div>
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

  if ((loading && !session) || !allowed) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--background)] px-4 text-[14px] text-[var(--muted)]">
        <div className="w-full max-w-sm" aria-busy="true" aria-label="Checking workspace access">
          <div className="squinia-skeleton h-10 w-44 rounded-xl" />
          <div className="squinia-skeleton mt-6 h-4 w-full rounded-full" />
          <div className="squinia-skeleton mt-3 h-4 w-2/3 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--background)] text-[var(--foreground)] md:flex-row" style={brandingStyle(branding)}>
      <aside className="shrink-0 border-b border-[var(--rule)] bg-[linear-gradient(180deg,#ffffff_0%,#f4f7f0_100%)] md:sticky md:top-0 md:h-[100dvh] md:w-[17rem] md:border-b-0 md:border-r">
        <div className="flex flex-col gap-3 px-4 py-4 md:px-5 md:py-6">
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
            href="/dashboard" target="_blank"
            className="mt-1 text-[12px] font-semibold text-[#0f6f34] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
            title="Open your learner-facing workspace for this organisation."
          >
            Learner workspace
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:px-4 md:pb-6" aria-label="Organization">
          {NAV_BEFORE.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
          <ScenarioStudioNav />
          {NAV_AFTER.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center justify-between border-b border-[var(--rule)] bg-[var(--surface)]/92 px-4 backdrop-blur-md sm:px-6">
          <p className="truncate text-[14px] font-semibold tracking-[-0.02em] text-[var(--foreground)]">
            {membership?.tenant_name ?? "Operator dashboard"}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <TenantSwitcher session={session} onSwitched={reload} />
            <StudentProfileMenu />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
