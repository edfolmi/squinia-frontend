"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SquiniaBrandLockup } from "@/app/_components/squinia-brand";
import { TenantSwitcher } from "@/app/_components/tenant-switcher";
import { brandingStyle } from "@/app/_lib/tenant-branding";
import { activeTenantBranding, defaultMembership, useSession } from "@/app/_lib/use-session";

import { StudentProfileMenu } from "./student-profile-menu";

const NAV = [
  { href: "/dashboard", label: "Dashboard", individualOnly: false },
  { href: "/scenarios", label: "Scenarios", individualOnly: false },
  { href: "/sessions", label: "Sessions", individualOnly: false },
  { href: "/assignments", label: "Assigned", individualOnly: false },
  { href: "/achievements", label: "Achievements", individualOnly: true },
  { href: "/settings/profile", label: "Account", individualOnly: false },
] as const;

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active =
    href === "/dashboard"
      ? pathname === "/dashboard"
      : href.startsWith("/settings")
        ? pathname.startsWith("/settings")
        : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`sim-transition relative rounded-xl px-3 py-2.5 text-[13px] font-medium ${
        active
          ? "bg-[var(--surface-strong)] text-white shadow-[0_16px_34px_-24px_rgba(16,23,17,0.75)]"
          : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </Link>
  );
}

export function StudentAppShell({ children }: { children: React.ReactNode }) {
  const { session, loading, reload } = useSession();
  const membership = defaultMembership(session);
  const branding = activeTenantBranding(session);
  const navItems = NAV.filter((item) => !item.individualOnly || membership?.account_kind === "individual");

  if (loading && !session) {
    return (
      <div className="flex min-h-[100dvh] bg-[var(--background)] px-6 text-[var(--foreground)]">
        <div className="m-auto w-full max-w-sm" aria-busy="true" aria-label="Loading workspace">
          <div className="squinia-skeleton h-10 w-40 rounded-xl" />
          <div className="squinia-skeleton mt-6 h-4 w-full rounded-full" />
          <div className="squinia-skeleton mt-3 h-4 w-2/3 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--background)] text-[var(--foreground)] md:flex-row" style={brandingStyle(branding)}>
      <aside className="app-print-hidden shrink-0 border-b border-[var(--rule)] bg-[linear-gradient(180deg,#ffffff_0%,#f4f7f0_100%)] md:sticky md:top-0 md:h-[100dvh] md:w-[17rem] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-4 md:flex-col md:items-stretch md:gap-5 md:px-5 md:py-6">
          <SquiniaBrandLockup
            href="/dashboard"
            context="Student"
            orientation="inline"
            logoUrl={branding.logo_url}
            brandName={membership?.tenant_name ?? "Squinia"}
          />
          <p className="hidden max-w-[12rem] text-[12px] leading-relaxed text-[var(--muted)] md:block">
            Precision practice for high-stakes conversations.
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:px-4 md:pb-0" aria-label="Student">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
        <div className="hidden px-5 pt-6 md:block">
          <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-4 shadow-sm">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--faint)]">Workspace</p>
            <p className="mt-2 truncate text-[13px] font-semibold text-[var(--foreground)]">
              {membership?.tenant_name ?? "Learning workspace"}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">Feedback, scores, transcripts, and practice history stay connected here.</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="app-print-hidden sticky top-0 z-20 flex h-[60px] shrink-0 items-center justify-between border-b border-[var(--rule)] bg-[var(--surface)]/92 px-4 backdrop-blur-md sm:px-6">
          <p className="truncate text-[14px] font-semibold tracking-[-0.02em] text-[var(--foreground)]">
            {membership?.tenant_name ?? "Learning workspace"}
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
