"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MetricCard, ProductPageHeader, StatusBadge } from "@/app/_components/product-ui";
import { v1, type ItemsData } from "@/app/_lib/v1-client";

type ScenarioApi = {
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  estimated_minutes?: number;
  updated_at?: string;
};

function formatUpdated(value?: string): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function OrgScenariosListClient() {
  const [items, setItems] = useState<ScenarioApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<ItemsData<ScenarioApi>>("scenarios", { limit: 100, page: 1 });
    if (!res.ok) {
      setError(res.message);
      setItems([]);
    } else {
      setItems(res.data.items ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const stats = useMemo(() => {
    const published = items.filter((item) => (item.status ?? "").toUpperCase() === "PUBLISHED").length;
    const draft = Math.max(0, items.length - published);
    const avgMinutes = items.length
      ? Math.round(items.reduce((sum, item) => sum + (item.estimated_minutes ?? 30), 0) / items.length)
      : 0;
    return { published, draft, avgMinutes };
  }, [items]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ProductPageHeader
        eyebrow="Scenario studio"
        title="Scenario library"
        description="Build, review, and publish realistic simulations for cohorts and individual practice."
        action={
          <Link
            href="/org/scenarios/new"
            className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto"
          >
            New scenario
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Scenarios" value={loading ? "--" : items.length} detail="Total in library" />
        <MetricCard label="Published" value={loading ? "--" : stats.published} detail={`${stats.draft} drafts`} tone="success" />
        <MetricCard label="Avg length" value={loading ? "--" : `${stats.avgMinutes}m`} detail="Estimated practice time" />
      </section>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-[var(--warning-soft)] px-4 py-3 text-[14px] text-amber-950">{error}</p>
      ) : null}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="squinia-card p-5">
              <div className="squinia-skeleton h-5 w-52 rounded-lg" />
              <div className="squinia-skeleton mt-3 h-4 w-4/5 rounded-lg" />
              <div className="squinia-skeleton mt-5 h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--rule-strong)] bg-[var(--surface)] p-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">No scenarios yet</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-6 text-[var(--muted)]">
            Create the first simulation scenario, attach a persona and rubric, then publish it for learners.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((scenario) => {
            const published = (scenario.status ?? "").toUpperCase() === "PUBLISHED";
            return (
              <li key={scenario.id}>
                <div className="flex h-full flex-col rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--foreground)]">{scenario.title}</h2>
                        <StatusBadge tone={published ? "success" : "warning"}>{published ? "Published" : scenario.status ?? "Draft"}</StatusBadge>
                      </div>
                      <p className="mt-2 line-clamp-3 text-[14px] leading-6 text-[var(--muted)]">
                        {scenario.description ?? "No description added yet."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--rule)] pt-5 text-[12px]">
                    <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-2">
                      <p className="font-mono uppercase tracking-[0.12em] text-[var(--faint)]">Duration</p>
                      <p className="mt-1 font-semibold text-[var(--foreground)]">~{scenario.estimated_minutes ?? 30} min</p>
                    </div>
                    <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/35 px-3 py-2">
                      <p className="font-mono uppercase tracking-[0.12em] text-[var(--faint)]">Updated</p>
                      <p className="mt-1 font-semibold text-[var(--foreground)]">{formatUpdated(scenario.updated_at)}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <Link
                      href={`/org/scenarios/${scenario.id}/edit`}
                      className="sim-transition rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-center text-[12px] font-semibold text-[var(--muted)] hover:bg-[var(--field)] hover:text-[var(--foreground)]"
                    >
                      Edit scenario
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
