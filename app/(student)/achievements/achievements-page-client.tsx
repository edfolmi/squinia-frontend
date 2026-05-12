"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState, StatusBanner } from "@/app/_components/status-block";
import { MetricCard, ProductPageHeader, SkeletonBlock } from "@/app/_components/product-ui";
import { v1 } from "@/app/_lib/v1-client";

import { AchievementCard } from "./achievement-card";
import type { AchievementItem, AchievementLibrary } from "./achievement-types";

function LoadingState() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading certificates">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-64" />
        ))}
      </div>
    </div>
  );
}

function CertificateSection({ title, items, empty }: { title: string; items: AchievementItem[]; empty: string }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">
            Certificate library
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-[var(--foreground)]">{title}</h2>
        </div>
      </div>
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <AchievementCard key={item.key} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState title={title} message={empty} action={{ href: "/scenarios", label: "Start practice" }} />
      )}
    </section>
  );
}

export function AchievementsPageClient() {
  const [data, setData] = useState<AchievementLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<AchievementLibrary>("me/achievements");
    if (!res.ok) {
      setError(res.message);
      setData(null);
      setLoading(false);
      return;
    }
    setData(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const earned = useMemo(() => (data?.items ?? []).filter((item) => item.earned), [data]);
  const locked = useMemo(() => (data?.items ?? []).filter((item) => !item.earned), [data]);
  const nextLocked = locked.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ProductPageHeader
        eyebrow="Private certificates"
        title="Achievement certificates"
        description="Professional evidence of individual practice progress. Certificates are private to your learner workspace."
        action={
          <Link href="/dashboard" className="rounded-lg border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-2 text-[13px] font-semibold text-[var(--foreground)] hover:bg-[var(--field)]">
            Back to dashboard
          </Link>
        }
      />

      {error ? <StatusBanner tone="danger" title="Certificates unavailable" message={error} /> : null}

      {loading ? (
        <LoadingState />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Earned" value={data.summary.earned} detail="Private certificates" tone="success" />
            <MetricCard label="Available" value={data.summary.total} detail="Level and skill certificates" />
            <MetricCard label="In progress" value={data.summary.locked} detail="Unlocked through scored evidence" />
          </div>

          <CertificateSection
            title="Earned certificates"
            items={earned}
            empty="Complete scored individual simulations to earn your first professional certificate."
          />

          {nextLocked.length ? (
            <CertificateSection
              title="Next certificates"
              items={nextLocked}
              empty="Locked certificates appear after Squinia can read your current progression."
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
