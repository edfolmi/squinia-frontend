"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/org", label: "Organization" },
  { href: "/settings/members", label: "Members" },
  { href: "/settings/billing", label: "Billing" },
] as const;

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
        active
          ? "bg-[var(--field)] text-[#111111] ring-1 ring-[var(--rule-strong)]"
          : "text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
      }`}
    >
      {label}
    </Link>
  );
}

export function SettingsAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--background)] text-[#111111] md:flex-row">
      <aside className="shrink-0 border-b border-[var(--rule)] bg-[var(--surface)] md:w-52 md:border-b-0 md:border-r">
        <div className="flex flex-col gap-1 px-4 py-4 md:px-3 md:py-6">
          <Link href="/dashboard" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">
            Squinia
          </Link>
          <p className="text-[11px] font-medium text-[#111111]">Settings</p>
          <Link
            href="/dashboard"
            className="text-[12px] font-medium text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
          >
            ← Back to app
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:px-2 md:pb-6" aria-label="Settings">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] shrink-0 items-center border-b border-[var(--rule)] bg-[var(--surface)]/90 px-4 backdrop-blur-sm sm:px-6">
          <p className="truncate text-[14px] font-medium tracking-[-0.02em] text-[#111111]">Account & workspace</p>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
