"use client";

import { Suspense, useCallback, useEffect, useState } from "react";

import { v1, type ItemsData } from "@/app/_lib/v1-client";

import { SkillGapHeatmap, type HeatmapCohort } from "../_components/skill-gap-heatmap";

import { AnalyticsDashboard } from "./analytics-dashboard";

type CohortRow = { id: string; name: string; description?: string | null };

type Overview = { avg_score?: number | null; completion_rate?: number };

export function AnalyticsPageClient() {
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [stats, setStats] = useState<Record<string, Overview>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<ItemsData<CohortRow>>("cohorts", { limit: 50, page: 1 });
    if (!res.ok) {
      setError(res.message);
      setCohorts([]);
      setLoading(false);
      return;
    }
    const items = res.data.items ?? [];
    setCohorts(items);
    const next: Record<string, Overview> = {};
    await Promise.all(
      items.map(async (c) => {
        const o = await v1.get<{ overview: Overview }>(`analytics/cohorts/${c.id}/overview`);
        if (o.ok) next[c.id] = o.data.overview;
      }),
    );
    setStats(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cohortSummaries: HeatmapCohort[] = cohorts.map((c) => ({
    id: c.id,
    name: c.name,
    avgScore: stats[c.id]?.avg_score != null ? Math.round(stats[c.id].avg_score as number) : null,
  }));

  const cohortStatsForDashboard = cohorts.map((c) => {
    const o = stats[c.id];
    return {
      id: c.id,
      name: c.name,
      avg: o?.avg_score != null ? Math.round(o.avg_score) : null,
      completion: o?.completion_rate != null ? Math.round(o.completion_rate * 100) : 0,
    };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Analytics</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
          Cohort-level averages from <span className="font-mono text-[11px]">GET /api/v1/analytics/cohorts/…</span>.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[14px] text-[var(--muted)]">Loading…</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            {cohortStatsForDashboard.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_4px_24px_-16px_rgba(0,0,0,0.06)]"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">Cohort</p>
                <p className="mt-2 text-lg font-semibold text-[#111111]">{c.name}</p>
                <div className="mt-4 flex gap-8 font-mono text-[13px] tabular-nums">
                  <div>
                    <p className="text-[var(--faint)]">Avg score</p>
                    <p className="mt-0.5 font-medium text-[#166534]">{c.avg != null ? `${c.avg}%` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[var(--faint)]">Completion</p>
                    <p className="mt-0.5 font-medium text-[#111111]">{c.completion}%</p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Skill gap heatmap</h2>
            <p className="max-w-2xl text-[14px] text-[var(--muted)]">
              Uses cohort average score vs fixed program targets on each dimension (until skill-map payloads are richer).
            </p>
            {cohortSummaries.length ? <SkillGapHeatmap cohorts={cohortSummaries} /> : (
              <p className="text-[14px] text-[var(--muted)]">No cohorts to chart.</p>
            )}
            <Suspense
              fallback={
                <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-8 text-[14px] text-[var(--muted)]">
                  Loading…
                </div>
              }
            >
              <AnalyticsDashboard cohortSummaries={cohortStatsForDashboard} members={[]} />
            </Suspense>
          </section>
        </>
      )}
    </div>
  );
}
