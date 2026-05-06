"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

type Org = {
  id: string;
  name: string;
  slug: string;
  planName: string;
  branding?: {
    logo_url?: string | null;
    primary_color?: string | null;
  };
};

export function OrgSettingsForm({ initial }: { initial: Org }) {
  const [name] = useState(initial.name);
  const [slug] = useState(initial.slug);
  const [logoUrl, setLogoUrl] = useState(initial.branding?.logo_url ?? "");
  const [primaryColor, setPrimaryColor] = useState(initial.branding?.primary_color ?? "#32a852");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSaveBranding(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await v1.patch<{ branding: { logo_url?: string | null; primary_color?: string | null } }>(
        `tenants/${initial.id}/branding`,
        {
          logo_url: logoUrl.trim() || null,
          primary_color: primaryColor,
        },
      );
      if (res.ok) {
        setLogoUrl(res.data.branding.logo_url ?? "");
        setPrimaryColor(res.data.branding.primary_color ?? "#32a852");
        setMessage("Branding updated.");
      } else {
        setError(res.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function onLogoFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const data = new FormData();
      data.set("logo", file);
      const res = await v1.upload<{ logo_url: string }>(`tenants/${initial.id}/branding/logo`, data);
      if (res.ok) {
        setLogoUrl(res.data.logo_url);
        setMessage("Logo uploaded.");
      } else {
        setError(res.message);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      {error ? <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-[13px] text-red-900">{error}</p> : null}
      {message ? <p className="rounded-xl border border-[#166534]/30 bg-[#e6f4ea]/70 px-3 py-2 text-[13px] text-[#166534]">{message}</p> : null}

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

      <form onSubmit={onSaveBranding} className="space-y-5 border-t border-[var(--rule)] pt-8">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Branding</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-32 items-center justify-center rounded-xl border border-[var(--rule)] bg-[var(--field)]/50 p-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={`${name} logo`} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">Default</span>
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-[13px] font-medium text-[#111111] hover:bg-[var(--field)]">
            {uploading ? "Uploading..." : "Upload logo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => void onLogoFile(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>
        </div>
        <div>
          <label htmlFor="logoUrl" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Logo URL
          </label>
          <input
            id="logoUrl"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Uses Squinia logo when blank"
            className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
        </div>
        <div>
          <label htmlFor="primaryColor" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Primary color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-11 w-14 rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] p-1"
            />
            <input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 font-mono text-[14px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || uploading}
          className="sim-btn-accent px-6 py-2.5 font-mono text-[10px] uppercase disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save branding"}
        </button>
      </form>
    </div>
  );
}
