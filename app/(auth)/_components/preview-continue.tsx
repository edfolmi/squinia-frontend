"use client";

import Link from "next/link";

import { authApiConfigured } from "../_lib/auth-api";

type Props = {
  href: string;
  label?: string;
};

/** Shown only when the API origin is unavailable in a local preview environment. */
export function PreviewContinue({ href, label = "Continue without connecting services" }: Props) {
  if (authApiConfigured()) return null;
  return (
    <p className="border-t border-[var(--rule)] pt-4 text-center">
      <Link href={href} className="text-[13px] font-medium text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline">
        {label}
      </Link>
    </p>
  );
}
