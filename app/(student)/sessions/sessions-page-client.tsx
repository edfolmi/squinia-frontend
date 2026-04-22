"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { v1, type ItemsData } from "@/app/_lib/v1-client";
import { sessionModeToUiKind } from "@/app/_lib/simulation-mappers";

import type { RecentSessionRow } from "../_lib/student-mock-data";
import { SessionsTable } from "./sessions-table";

type SessionItem = {
  id: string;
  mode?: string;
  scenario_id: string;
  scenario_snapshot?: Record<string, unknown>;
  ended_at?: string | null;
  updated_at?: string;
};

function snapshotTitle(snap: unknown): string {
  if (snap && typeof snap === "object" && snap !== null && "title" in snap) {
    const t = (snap as { title?: unknown }).title;
    if (typeof t === "string" && t.length) return t;
  }
  return "Simulation";
}

export function SessionsPageClient() {
  const [rows, setRows] = useState<RecentSessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<ItemsData<SessionItem>>("sessions", { limit: 100, page: 1 });
    if (!res.ok) {
      setError(res.message);
      setRows([]);
      setLoading(false);
      return;
    }
    const mapped: RecentSessionRow[] = (res.data.items ?? []).map((s) => ({
      sessionId: s.id,
      kind: sessionModeToUiKind(s.mode),
      scenarioTitle: snapshotTitle(s.scenario_snapshot),
      score: null,
      endedAt: s.ended_at ?? s.updated_at ?? new Date().toISOString(),
      apiScenarioId: s.scenario_id,
    }));
    mapped.sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime());
    setRows(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Session history</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Simulations are grouped by scenario. Expand a row to open reports for each attempt. Scores appear when
          evaluations are available.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[14px] text-[var(--muted)]">Loading sessions…</p>
      ) : rows.length === 0 ? (
        <p className="text-[14px] text-[var(--muted)]">No sessions yet.</p>
      ) : (
        <SessionsTable rows={rows} />
      )}

      <p className="text-[13px] leading-relaxed text-[var(--muted)]">
        Start a run from{" "}
        <Link href="/scenarios" className="font-medium text-[#111111] underline underline-offset-2">
          Scenarios
        </Link>{" "}
        or an assignment, then open the report from this list.
      </p>
    </div>
  );
}
