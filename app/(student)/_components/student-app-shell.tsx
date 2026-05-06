"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SquiniaBrandLockup } from "@/app/_components/squinia-brand";
import { brandingStyle } from "@/app/_lib/tenant-branding";
import { activeTenantBranding, defaultMembership, useSession } from "@/app/_lib/use-session";

import { StudentProfileMenu } from "./student-profile-menu";

const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/sessions", label: "Sessions" },
  { href: "/assignments", label: "Assigned" },
  { href: "/settings/profile", label: "Account" },
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

export function StudentAppShell({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const membership = defaultMembership(session);
  const branding = activeTenantBranding(session);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--background)] text-[#111111] md:flex-row" style={brandingStyle(branding)}>
      <aside className="shrink-0 border-b border-[var(--rule)] bg-[linear-gradient(180deg,#ffffff_0%,#f6f8f2_100%)] md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-4 md:flex-col md:items-stretch md:py-6">
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
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:px-3 md:pb-0" aria-label="Student">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-[var(--rule)] bg-[var(--surface)]/92 px-4 backdrop-blur-sm sm:px-6">
          <p className="truncate text-[14px] font-semibold tracking-[-0.02em] text-[#111111]">
            {membership?.tenant_name ?? "Learning workspace"}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <StudentProfileMenu />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
