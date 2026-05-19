import type { CSSProperties, ReactNode } from "react";

import type { VettingAssessment, VettingBranding, VettingMode } from "../_lib/vetting-client";

function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function hexToRgb(value: string): { r: number; g: number; b: number } | null {
  if (!isHexColor(value)) return null;
  return {
    r: Number.parseInt(value.slice(1, 3), 16),
    g: Number.parseInt(value.slice(3, 5), 16),
    b: Number.parseInt(value.slice(5, 7), 16),
  };
}

export function assessmentThemeStyle(branding?: VettingBranding | null): CSSProperties {
  const primary = branding?.primary_color?.trim();
  if (!primary) return {};
  const rgb = hexToRgb(primary);
  return {
    "--accent": primary,
    "--accent-hover": primary,
    "--accent-active": primary,
    "--focus-ring": rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.42)` : "var(--focus-ring)",
    "--accent-ring": rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)` : "var(--accent-ring)",
    "--accent-soft": rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : "var(--accent-soft)",
  } as CSSProperties;
}

export function modeLabel(mode?: VettingMode | string | null): string {
  switch ((mode || "TEXT").toUpperCase()) {
    case "VOICE":
      return "Voice";
    case "VIDEO":
      return "Video";
    default:
      return "Chat";
  }
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PublicLogo({
  assessment,
  className = "",
}: {
  assessment?: Pick<VettingAssessment, "title" | "branding" | "organization_name"> | null;
  className?: string;
}) {
  const logo = assessment?.branding?.logo_url;
  const label = assessment?.organization_name || assessment?.title || "Squinia";
  if (logo) {
    return (
      <img
        src={logo}
        alt={`${label} logo`}
        className={`h-11 w-11 rounded-xl border border-[var(--rule)] bg-[var(--surface)] object-contain p-1.5 ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] font-mono text-[13px] font-semibold text-white shadow-[0_10px_30px_-18px_var(--accent)] ${className}`}
      aria-hidden
    >
      SQ
    </div>
  );
}

export function VettingPublicShell({
  assessment,
  children,
}: {
  assessment?: VettingAssessment | null;
  children: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]" style={assessmentThemeStyle(assessment?.branding)}>
      <header className="border-b border-[var(--rule)] bg-[var(--surface)]/92 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <PublicLogo assessment={assessment} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-[var(--foreground)]">
                {assessment?.organization_name || "Squinia Vetting"}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                Soft-skill assessment
              </p>
            </div>
          </div>
          <span className="hidden rounded-full border border-[var(--rule)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] sm:inline-flex">
            Squinia Vetting
          </span>
        </div>
      </header>
      <main className="px-4 py-8 sm:px-6 lg:py-12">{children}</main>
    </div>
  );
}

export function LoadingAssessment() {
  return (
    <div className="mx-auto grid min-h-[60dvh] max-w-md place-items-center text-center">
      <div className="w-full">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] font-mono text-sm font-semibold text-white">
          SQ
        </div>
        <div className="squinia-skeleton mx-auto mt-8 h-5 w-52 rounded-xl" />
        <div className="squinia-skeleton mx-auto mt-3 h-4 w-72 max-w-full rounded-xl" />
      </div>
    </div>
  );
}
