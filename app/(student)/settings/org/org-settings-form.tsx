"use client";

import { useState } from "react";

type Org = { name: string; slug: string; planName: string };

export function OrgSettingsForm({ initial }: { initial: Org }) {
  const [name] = useState(initial.name);
  const [slug] = useState(initial.slug);

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Identity</h2>
        <div>
          <label htmlFor="oname" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Organization name
          </label>
          <input
            id="oname"
            value={name}
            readOnly
            className="w-full cursor-not-allowed rounded-xl border border-[var(--rule)] bg-[var(--field)]/80 px-4 py-3 text-[15px] text-[var(--muted)] outline-none"
          />
        </div>
        <div>
          <label htmlFor="slug" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            URL slug
          </label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 font-mono text-[13px] text-[var(--faint)]">app /</span>
            <input
              id="slug"
              value={slug}
              readOnly
              className="min-w-0 flex-1 cursor-not-allowed rounded-xl border border-[var(--rule)] bg-[var(--field)]/80 px-4 py-3 font-mono text-[14px] text-[var(--muted)] outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-[var(--rule)] pt-8">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Plan</h2>
        <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/50 px-4 py-4 text-[14px] text-[var(--muted)]">
          <p>
            <span className="font-medium text-[#111111]">{initial.planName}</span>
          </p>
          <p className="mt-2 text-[12px] text-[var(--faint)]">Manage plan changes from the Billing page.</p>
        </div>
      </div>
    </div>
  );
}
