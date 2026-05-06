import Image from "next/image";
import Link from "next/link";

import logoFull from "@/app/squinia-logo-full.png";
import logoMark from "@/app/squinia-logo.png";

type BrandLockupProps = {
  href?: string;
  context?: string;
  orientation?: "stacked" | "inline";
  compact?: boolean;
  priority?: boolean;
  className?: string;
  logoUrl?: string | null;
  brandName?: string;
};

export function SquiniaBrandLockup({
  href = "/dashboard",
  context,
  orientation = "stacked",
  compact = false,
  priority = true,
  className = "",
  logoUrl,
  brandName = "Squinia",
}: BrandLockupProps) {
  const image = compact ? logoMark : logoFull;
  const imageClassName = compact ? "h-9 w-auto" : "h-9 w-auto max-w-[152px]";
  const layoutClassName =
    orientation === "inline" ? "flex-row items-center justify-between gap-3" : "flex-col items-start gap-3";

  return (
    <Link
      href={href}
      className={`group flex min-w-0 ${layoutClassName} rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] ${className}`}
      aria-label={context ? `Squinia ${context}` : "Squinia"}
    >
      <span className="flex min-h-9 items-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={brandName} className={`${imageClassName} object-contain`} />
        ) : (
          <Image src={image} alt="Squinia" className={imageClassName} priority={priority} />
        )}
      </span>
      {context ? (
        <span className="rounded-full border border-[var(--rule)] bg-[var(--field)]/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          {context}
        </span>
      ) : null}
    </Link>
  );
}
