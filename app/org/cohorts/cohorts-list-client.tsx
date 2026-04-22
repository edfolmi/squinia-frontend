"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Cohorts</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
            Live data from your tenant. Create cohorts in the backend or via API; this list loads from{" "}
            <span className="font-mono text-[11px]">GET /api/v1/cohorts</span>.
          </p>
        </div>
        <Link
          href="/org/cohorts/new"
          className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto"
        >
          Create cohort
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[14px] text-[var(--muted)]">Loading cohorts…</p>
      ) : rows.length === 0 ? (
        <p className="text-[14px] text-[var(--muted)]">No cohorts yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => {
            const o = stats[c.id];
            const members = o?.total_members ?? 0;
            const avg = o?.avg_score != null ? Math.round(o.avg_score) : null;
            const completion = o?.completion_rate != null ? Math.round(o.completion_rate * 100) : null;
            return (
              <li key={c.id}>
                <Link
                  href={`/org/cohorts/${c.id}`}
                  className="block rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_4px_24px_-16px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_32px_-16px_rgba(0,0,0,0.1)] sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">{c.name}</h2>
                      <p className="mt-1 text-[14px] text-[var(--muted)]">{c.description ?? ""}</p>
                      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                        {members} members
                        {c.created_at
                          ? ` · created ${new Date(c.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}`
                          : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-6 font-mono text-[12px] tabular-nums sm:text-right">
                      <div>
                        <p className="text-[var(--faint)]">Avg score</p>
                        <p className="mt-0.5 font-medium text-[#166534]">{avg != null ? `${avg}%` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[var(--faint)]">Completion</p>
                        <p className="mt-0.5 font-medium text-[#111111]">{completion != null ? `${completion}%` : "—"}</p>
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
