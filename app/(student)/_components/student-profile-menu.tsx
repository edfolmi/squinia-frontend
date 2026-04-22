"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSession } from "@/app/_lib/use-session";
import { clearAuthTokens } from "@/app/(auth)/_lib/auth-tokens";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase() || "?";
}

export function StudentProfileMenu() {
  const { session, loading } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const fullName = session?.user?.full_name || "User";
  const email = session?.user?.email || "";
  const initials = useMemo(() => initialsFromName(fullName), [fullName]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleSignOut() {
    clearAuthTokens();
    setOpen(false);
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--rule)] bg-[var(--field)]">
        <span className="animate-pulse font-mono text-[10px] text-[var(--faint)]">…</span>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--rule)] bg-[var(--field)] font-mono text-[10px] font-medium text-[var(--muted)] transition-colors hover:border-[var(--rule-strong)] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {initials}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[var(--rule)] bg-[var(--surface)] py-2 shadow-[0_12px_48px_-12px_rgba(17,17,17,0.18)] ring-1 ring-black/[0.04]"
        >
          <div className="border-b border-[var(--rule)] px-4 py-3">
            <p className="truncate text-[13px] font-semibold text-[#111111]">{fullName}</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--muted)]">{email}</p>
          </div>
          <div className="py-1">
            <Link
              role="menuitem"
              href="/settings/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[14px] font-medium text-[#111111] transition-colors hover:bg-[var(--field)]"
            >
              Manage account
            </Link>
            <Link
              role="menuitem"
              href="/settings/profile#password"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[14px] text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
            >
              Password &amp; security
            </Link>
            <Link
              role="menuitem"
              href="/settings/billing"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[14px] text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
            >
              Plan &amp; billing
            </Link>
          </div>
          <div className="border-t border-[var(--rule)] py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="block w-full px-4 py-2.5 text-left text-[14px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
