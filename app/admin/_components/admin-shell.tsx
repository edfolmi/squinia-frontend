"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { SquiniaBrandLockup } from "@/app/_components/squinia-brand";
import { useSession } from "@/app/_lib/use-session";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/organizations", label: "Organizations" },
  { href: "/admin/catalog", label: "Catalog" },
];

function active(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();
  const allowed = session?.user?.platform_role === "PLATFORM_OWNER";

  useEffect(() => {
    if (!loading && !allowed) router.replace("/dashboard");
  }, [allowed, loading, router]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--background)] px-6 text-[14px] text-[var(--muted)]">
        Loading platform console...
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--background)] px-6 text-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Restricted</p>
          <h1 className="mt-3 text-2xl font-semibold text-[#111111]">Platform owner access required</h1>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[#111111]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[var(--rule)] bg-[var(--surface)] px-5 py-6 lg:block">
        <SquiniaBrandLockup href="/admin" compact />
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Owner console</p>
        <nav className="mt-8 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                active(pathname, item.href)
                  ? "bg-[#111111] text-white"
                  : "text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-[var(--rule)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur sm:px-6 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <SquiniaBrandLockup href="/admin" compact />
            <select
              aria-label="Admin navigation"
              value={NAV.find((item) => active(pathname, item.href))?.href ?? "/admin"}
              onChange={(event) => router.push(event.target.value)}
              className="rounded-lg border border-[var(--rule-strong)] bg-[var(--field)] px-3 py-2 text-[13px]"
            >
              {NAV.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
