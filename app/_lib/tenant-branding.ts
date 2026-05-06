import type { CSSProperties } from "react";

import type { TenantBranding } from "./use-session";

export const DEFAULT_ACCENT = "#32a852";

function darker(hex: string, amount: number): string {
  const raw = hex.replace("#", "");
  const value = Number.parseInt(raw, 16);
  if (!Number.isFinite(value)) return hex;
  const r = Math.max(0, ((value >> 16) & 255) - amount);
  const g = Math.max(0, ((value >> 8) & 255) - amount);
  const b = Math.max(0, (value & 255) - amount);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

export function brandingStyle(branding?: TenantBranding | null): CSSProperties {
  const accent = branding?.primary_color && /^#[0-9a-fA-F]{6}$/.test(branding.primary_color)
    ? branding.primary_color
    : DEFAULT_ACCENT;
  return {
    "--accent": accent,
    "--accent-hover": darker(accent, 18),
    "--accent-active": darker(accent, 34),
    "--focus-ring": `${accent}73`,
  } as CSSProperties;
}
