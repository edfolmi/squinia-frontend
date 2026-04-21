"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { MOCK_PROFILE } from "../settings/_lib/settings-mock-data";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase() || "?";
}

export function StudentProfileMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const initials = useMemo(() => initialsFromName(MOCK_PROFILE.fullName), []);

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
            <p className="truncate text-[13px] font-semibold text-[#111111]">{MOCK_PROFILE.fullName}</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--muted)]">{MOCK_PROFILE.email}</p>
            <p className="mt-1 text-[10px] text-[var(--faint)]">Preview — wire session user</p>
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
              Password & security
            </Link>
            <Link
              role="menuitem"
              href="/settings/billing"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[14px] text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
            >
              Plan & billing
            </Link>
          </div>
          <div className="border-t border-[var(--rule)] py-1">
            <Link
              role="menuitem"
              href="/login"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[14px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
            >
              Sign out
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
