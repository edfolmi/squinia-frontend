"use client";

import { personaInitials } from "../_lib/agent-personas";

export function PersonaAvatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "lg" ? "h-16 w-16 text-[18px]" : size === "sm" ? "h-10 w-10 text-[12px]" : "h-12 w-12 text-[14px]";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`${dims} shrink-0 rounded-full border border-[var(--rule)] object-cover`}
      />
    );
  }
  return (
    <div
      className={`${dims} flex shrink-0 items-center justify-center rounded-full border border-[var(--rule)] bg-[var(--field)] font-semibold text-[#111111]`}
      aria-hidden
    >
      {personaInitials(name)}
    </div>
  );
}
