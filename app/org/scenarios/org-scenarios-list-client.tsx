"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { v1, type ItemsData } from "@/app/_lib/v1-client";

type ScenarioApi = {
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  estimated_minutes?: number;
  updated_at?: string;
};

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
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Scenario library</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
            Scenarios from <span className="font-mono text-[11px]">GET /api/v1/scenarios</span> for your tenant.
          </p>
        </div>
        <Link
          href="/org/scenarios/new"
          className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto"
        >
          New scenario
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[14px] text-[var(--muted)]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-[14px] text-[var(--muted)]">No scenarios yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => {
            const published = (s.status ?? "").toUpperCase() === "PUBLISHED";
            return (
              <li key={s.id}>
                <div className="flex flex-col gap-3 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_4px_24px_-16px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">{s.title}</h2>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ${
                          published ? "bg-[#e6f4ea] text-[#166534]" : "bg-amber-50 text-[#a16207]"
                        }`}
                      >
                        {published ? "Published" : s.status ?? "Draft"}
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] text-[var(--muted)]">{s.description ?? ""}</p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                      ~{s.estimated_minutes ?? 30} min · updated{" "}
                      {s.updated_at
                        ? new Date(s.updated_at).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <Link
                    href={`/org/scenarios/${s.id}/edit`}
                    className="shrink-0 rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-center text-[12px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
