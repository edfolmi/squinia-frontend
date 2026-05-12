import Link from "next/link";

import { StatusBadge } from "@/app/_components/product-ui";

import { evidenceText, formatAchievementDate, type AchievementItem } from "./achievement-types";

export function AchievementCard({ item }: { item: AchievementItem }) {
  return (
    <article className="squinia-card-soft flex min-h-[16rem] flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-[var(--rule)] bg-[var(--surface)]">
          <span className="font-mono text-[11px] font-semibold uppercase text-[#166534]" aria-hidden>
            {item.kind === "level" ? "LV" : "SK"}
          </span>
        </div>
        <StatusBadge tone={item.earned ? "success" : "neutral"}>{item.earned ? "Earned" : "Locked"}</StatusBadge>
      </div>
      <div className="mt-5 flex-1">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">
          {item.kind === "level" ? "Level certificate" : "Skill certificate"}
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-[var(--foreground)]">{item.certificate_title}</h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--muted)]">{item.description}</p>
      </div>
      <div className="mt-5 border-t border-[var(--rule)] pt-4">
        <p className="text-[12px] leading-5 text-[var(--muted)]">
          {item.earned ? evidenceText(item) : item.progress.label}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
            {item.earned ? formatAchievementDate(item.earned_at) : "Keep practicing"}
          </p>
          {item.earned && item.earned_id ? (
            <Link
              href={`/achievements/${item.earned_id}`}
              className="rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--field)]"
            >
              View certificate
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
