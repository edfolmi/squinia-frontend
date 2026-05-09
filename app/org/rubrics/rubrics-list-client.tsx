"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { v1, type ItemsData } from "@/app/_lib/v1-client";

import type { RubricBoardApi } from "../_lib/rubrics";

export function RubricsListClient() {
  const [items, setItems] = useState<RubricBoardApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<ItemsData<RubricBoardApi>>("rubrics");
    if (!res.ok) {
      setError(res.message);
      setItems([]);
    } else {
      setItems(res.data.items ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Rubric boards</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
            Create reusable evaluation boards and copy them into scenarios when you need stable scoring criteria.
          </p>
        </div>
        <Link href="/org/rubrics/new" className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto">
          New rubric
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[14px] text-[var(--muted)]">Loading...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-6">
          <p className="text-[14px] text-[var(--muted)]">No rubric boards yet. Create one or use a custom rubric inside a scenario.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((rubric) => (
            <li key={rubric.id}>
              <div className="flex flex-col gap-4 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_4px_24px_-16px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">{rubric.name}</h2>
                    {rubric.is_default ? (
                      <span className="rounded-full bg-[#e6f4ea] px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[#166534]">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[14px] text-[var(--muted)]">{rubric.description || "Reusable scoring criteria"}</p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                    {rubric.items?.length ?? 0} criteria
                  </p>
                </div>
                <Link
                  href={`/org/rubrics/${rubric.id}/edit`}
                  className="shrink-0 rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-center text-[12px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
