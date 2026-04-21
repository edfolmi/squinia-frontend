"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type Org = {
  name: string;
  slug: string;
  logoUrl: string;
  primaryColor: string;
  planName: string;
  planSeats: number;
  seatsUsed: number;
  renewsAt: string;
};

export function OrgSettingsForm({ initial }: { initial: Org }) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [primaryColor, setPrimaryColor] = useState(initial.primaryColor);
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg("Preview — organization not persisted.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {msg ? (
        <p className="rounded-xl border border-[#166534]/30 bg-[#e6f4ea]/70 px-3 py-2 text-[13px] text-[#166534]">{msg}</p>
      ) : null}

      <div className="space-y-5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Identity</h2>
        <div>
          <label htmlFor="oname" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Organization name
          </label>
          <input
            id="oname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
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
              onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase())}
              className="min-w-0 flex-1 rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 font-mono text-[14px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
        </div>
      </div>

      <div className="space-y-5 border-t border-[var(--rule)] pt-8">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Branding</h2>
        <div>
          <label htmlFor="logo" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Logo URL
          </label>
          <input
            id="logo"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
          <p className="mt-1 text-[12px] text-[var(--faint)]">MVP: paste a URL. File upload can map to the same field after storage is wired.</p>
        </div>
        <div>
          <label htmlFor="color" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Primary accent
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="color"
              type="color"
              value={primaryColor.length === 7 ? primaryColor : "#32a852"}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-11 w-16 cursor-pointer rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)]"
            />
            <input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-36 rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-3 py-2 font-mono text-[13px] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-[var(--rule)] pt-8">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Plan</h2>
        <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/50 px-4 py-4 text-[14px] text-[var(--muted)]">
          <p>
            <span className="font-medium text-[#111111]">{initial.planName}</span> · {initial.seatsUsed} /{" "}
            {initial.planSeats} seats in use
          </p>
          <p className="mt-2 font-mono text-[12px] text-[var(--faint)]">
            Renews{" "}
            {new Date(initial.renewsAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <p className="mt-2 text-[12px] text-[var(--faint)]">Upgrade or cancel from Billing (stub) until Stripe is connected.</p>
        </div>
      </div>

      <button type="submit" className="sim-btn-accent px-6 py-2.5 font-mono text-[10px] uppercase">
        Save organization
      </button>
    </form>
  );
}
