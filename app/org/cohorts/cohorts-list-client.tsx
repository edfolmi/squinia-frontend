"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { MetricCard, ProductPageHeader, StatusBadge } from "@/app/_components/product-ui";
import { v1, type ItemsData } from "@/app/_lib/v1-client";

type CohortRow = {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
};

type Overview = { total_members?: number; avg_score?: number | null; completion_rate?: number };

export function CohortsListClient() {
  const [rows, setRows] = useState<CohortRow[]>([]);
  const [stats, setStats] = useState<Record<string, Overview>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<ItemsData<CohortRow>>("cohorts", { limit: 50, page: 1 });
    if (!res.ok) {
      setError(res.message);
      setRows([]);
      setLoading(false);
      return;
    }
    const items = res.data.items ?? [];
    setRows(items);

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
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const totals = rows.reduce(
    (acc, row) => {
      const overview = stats[row.id];
      acc.members += overview?.total_members ?? 0;
      if (overview?.avg_score != null) acc.scores.push(overview.avg_score);
      if (overview?.completion_rate != null) acc.completions.push(overview.completion_rate);
      return acc;
    },
    { members: 0, scores: [] as number[], completions: [] as number[] },
  );
  const avgScore = totals.scores.length ? Math.round(totals.scores.reduce((sum, value) => sum + value, 0) / totals.scores.length) : null;
  const avgCompletion = totals.completions.length
    ? Math.round((totals.completions.reduce((sum, value) => sum + value, 0) / totals.completions.length) * 100)
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ProductPageHeader
        eyebrow="Cohort operations"
        title="Cohorts"
        description="Manage learner groups, monitor readiness, and spot where facilitators should intervene."
        action={
          <Link
            href="/org/cohorts/new"
            className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto"
          >
            Create cohort
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Cohorts" value={loading ? "--" : rows.length} detail="Active workspaces" />
        <MetricCard label="Learners" value={loading ? "--" : totals.members} detail="Across all cohorts" />
        <MetricCard
          label="Avg completion"
          value={loading || avgCompletion == null ? "--" : `${avgCompletion}%`}
          detail={avgScore == null ? "No scores yet" : `${avgScore}% avg score`}
          tone="success"
        />
      </section>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-[var(--warning-soft)] px-4 py-3 text-[14px] text-amber-950">{error}</p>
      ) : null}

      {loading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="squinia-card p-5">
              <div className="squinia-skeleton h-5 w-48 rounded-lg" />
              <div className="squinia-skeleton mt-3 h-4 w-2/3 rounded-lg" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--rule-strong)] bg-[var(--surface)] p-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">No cohorts yet</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-6 text-[var(--muted)]">
            Create a cohort to start assigning scenarios, inviting learners, and tracking rubric progress.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((c) => {
            const overview = stats[c.id];
            const members = overview?.total_members ?? 0;
            const avg = overview?.avg_score != null ? Math.round(overview.avg_score) : null;
            const completion = overview?.completion_rate != null ? Math.round(overview.completion_rate * 100) : null;
            return (
              <li key={c.id}>
                <Link
                  href={`/org/cohorts/${c.id}`}
                  className="sim-transition block h-full rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:border-[var(--rule-strong)] sm:p-6"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--foreground)]">{c.name}</h2>
                        <StatusBadge tone={completion != null && completion >= 75 ? "success" : "neutral"}>
                          {completion != null ? `${completion}% complete` : "New"}
                        </StatusBadge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-[var(--muted)]">{c.description ?? "Cohort-specific simulations, assignments, and performance tracking."}</p>
                      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                        {members} members
                        {c.created_at
                          ? ` / created ${new Date(c.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}`
                          : null}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 font-mono text-[12px] tabular-nums sm:min-w-40">
                      <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-2">
                        <p className="text-[var(--faint)]">Avg score</p>
                        <p className="mt-0.5 font-medium text-[#166534]">{avg != null ? `${avg}%` : "--"}</p>
                      </div>
                      <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-2">
                        <p className="text-[var(--faint)]">Completion</p>
                        <p className="mt-0.5 font-medium text-[var(--foreground)]">{completion != null ? `${completion}%` : "--"}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
