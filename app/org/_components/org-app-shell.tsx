"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/org/cohorts", label: "Cohorts" },
  { href: "/org/scenarios", label: "Scenarios" },
  { href: "/org/assignments", label: "Assignments" },
  { href: "/org/analytics", label: "Analytics" },
] as const;

function navActive(href: string, pathname: string): boolean {
  switch (href) {
    case "/org/cohorts":
      return pathname === "/org/cohorts" || pathname.startsWith("/org/cohorts/");
    case "/org/scenarios":
      return pathname.startsWith("/org/scenarios");
    case "/org/assignments":
      return pathname.startsWith("/org/assignments");
    case "/org/analytics":
      return pathname === "/org/analytics";
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

export function OrgAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--background)] text-[#111111] md:flex-row">
      <aside className="shrink-0 border-b border-[var(--rule)] bg-[var(--surface)] md:w-56 md:border-b-0 md:border-r">
        <div className="flex flex-col gap-1 px-4 py-4 md:px-3 md:py-6">
          <Link href="/org/cohorts" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">
            Squinia
          </Link>
          <p className="text-[11px] font-medium text-[#111111]">Organization</p>
          <p className="text-[11px] text-[var(--muted)]">Bootcamp operator</p>
          <Link
            href="/dashboard"
            className="mt-1 text-[12px] font-medium text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
          >
            Student view
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:px-2 md:pb-6" aria-label="Organization">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--rule)] bg-[var(--surface)]/90 px-4 backdrop-blur-sm sm:px-6">
          <p className="truncate text-[14px] font-medium tracking-[-0.02em] text-[#111111]">Operator dashboard</p>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)] sm:inline">
            Preview
          </span>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
