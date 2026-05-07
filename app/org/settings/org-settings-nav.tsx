"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/org/settings", label: "Organization" },
  { href: "/org/settings/members", label: "Staff" },
  { href: "/org/settings/billing", label: "Billing" },
] as const;

export function OrgSettingsNav() {
  const pathname = usePathname();

  return (
    <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-2 shadow-[0_4px_24px_-16px_rgba(0,0,0,0.06)]">
      <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--faint)]">Organization settings</p>
      <nav className="flex flex-wrap gap-1 sm:flex-nowrap sm:overflow-x-auto" aria-label="Organization settings sections">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/org/settings" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-[var(--field)] text-[#111111] ring-1 ring-[var(--rule-strong)]"
                  : "text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
