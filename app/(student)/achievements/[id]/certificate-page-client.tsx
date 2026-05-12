"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { StatusBanner } from "@/app/_components/status-block";
import { SkeletonBlock } from "@/app/_components/product-ui";
import { v1 } from "@/app/_lib/v1-client";

import { evidenceText, formatAchievementDate, type AchievementDetail } from "../achievement-types";

function scoreValue(snapshot: Record<string, unknown>, key: string): string {
  const value = snapshot[key];
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}` : "--";
}

function printCertificate() {
  window.print();
}

export function CertificatePageClient({ achievementId }: { achievementId: string }) {
  const [data, setData] = useState<AchievementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<AchievementDetail>(`me/achievements/${achievementId}`);
    if (!res.ok) {
      setError(res.message);
      setData(null);
      setLoading(false);
      return;
    }
    setData(res.data);
    setLoading(false);
  }, [achievementId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5" aria-busy="true" aria-label="Loading certificate">
        <SkeletonBlock className="h-12 w-64" />
        <SkeletonBlock className="h-[34rem]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <StatusBanner tone="danger" title="Certificate unavailable" message={error ?? "Certificate not found."} />
        <Link href="/achievements" className="sim-btn-accent inline-flex px-5 py-2.5 font-mono text-[10px] uppercase">
          Back to certificates
        </Link>
      </div>
    );
  }

  const { achievement, recipient } = data;
  const score = achievement.score_snapshot ?? {};

  return (
    <div className="certificate-print-root mx-auto max-w-6xl space-y-6">
      <div className="certificate-actions flex flex-wrap items-center justify-between gap-3">
        <Link href="/achievements" className="rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-2 text-[13px] font-semibold text-[var(--foreground)] hover:bg-[var(--field)]">
          Back to certificates
        </Link>
        <button type="button" onClick={printCertificate} className="sim-btn-accent px-5 py-2.5 font-mono text-[10px] uppercase">
          Print / Save as PDF
        </button>
      </div>

      <section className="certificate-sheet overflow-hidden rounded-lg border border-[#d7d1bd] bg-[#fffdf7] shadow-[0_26px_90px_-60px_rgba(17,17,17,0.5)]">
        <div className="border-b border-[#e5ddc7] bg-[#101711] px-8 py-8 text-white sm:px-12">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9be6ac]">
            Squinia private certificate
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {achievement.certificate_title}
          </h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-7 text-white/70">
            Awarded from scored AI simulation evidence in an individual learner workspace.
          </p>
        </div>

        <div className="grid gap-10 px-8 py-10 sm:px-12 lg:grid-cols-[1fr_18rem]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--faint)]">
              Presented to
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#111111]">{recipient.name}</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--muted)]">{achievement.description}</p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-[#e5ddc7] bg-white/70 p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]">Mastery</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-[#166534]">
                  {scoreValue(score, "mastery_score")}
                </p>
              </div>
              <div className="rounded-lg border border-[#e5ddc7] bg-white/70 p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]">Level</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-[#111111]">
                  {scoreValue(score, "highest_level")}
                </p>
              </div>
              <div className="rounded-lg border border-[#e5ddc7] bg-white/70 p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--faint)]">Evidence</p>
                <p className="mt-2 text-sm font-semibold text-[#111111]">{evidenceText(achievement)}</p>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-[#e5ddc7] bg-white/78 p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">
              Certificate record
            </p>
            <dl className="mt-5 space-y-4 text-[13px]">
              <div>
                <dt className="text-[var(--muted)]">Issued</dt>
                <dd className="mt-1 font-semibold text-[#111111]">{formatAchievementDate(achievement.earned_at)}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Serial</dt>
                <dd className="mt-1 break-all font-mono text-[11px] text-[#111111]">{achievement.certificate_serial}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Recipient email</dt>
                <dd className="mt-1 break-all font-mono text-[11px] text-[#111111]">{recipient.email}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </div>
  );
}
