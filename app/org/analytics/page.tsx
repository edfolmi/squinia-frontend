import { Suspense } from "react";

import { ORG_COHORTS, cohortAverageScore, cohortCompletionRate } from "../_lib/org-mock-data";

import { AnalyticsDashboard } from "./analytics-dashboard";

export default function OrgAnalyticsPage() {
  const cohortStats = ORG_COHORTS.map((c) => ({
    id: c.id,
    name: c.name,
    avg: cohortAverageScore(c.id),
    completion: cohortCompletionRate(c.id),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Analytics</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
          Cohort-level averages, completion, skill-gap heatmap, and per-student drill-down for operators running bootcamps
          at scale.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {cohortStats.map((c) => (
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
          Gap = program target minus cohort average on each dimension. Use it to decide where curriculum or coaching
          should focus.
        </p>
        <Suspense
          fallback={<div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-8 text-[14px] text-[var(--muted)]">Loading analytics…</div>}
        >
          <AnalyticsDashboard cohortSummaries={cohortStats} />
        </Suspense>
      </section>
    </div>
  );
}
