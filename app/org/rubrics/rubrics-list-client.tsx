"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProductPageHeader, StatusBadge } from "@/app/_components/product-ui";
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
    <div className="mx-auto max-w-6xl space-y-8">
      <ProductPageHeader
        eyebrow="Scenario studio"
        title="Rubric boards"
        description="Create reusable evaluation boards and copy them into scenarios when you need stable scoring criteria."
        action={
          <Link href="/org/rubrics/new" className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto">
            New rubric
          </Link>
        }
      />

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
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((rubric) => (
            <li key={rubric.id}>
              <div className="flex h-full flex-col gap-4 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">{rubric.name}</h2>
                    {rubric.is_default ? <StatusBadge tone="success">Default</StatusBadge> : null}
                  </div>
                  <p className="mt-1 text-[14px] text-[var(--muted)]">{rubric.description || "Reusable scoring criteria"}</p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                    {rubric.items?.length ?? 0} criteria
                  </p>
                </div>
                <div className="mt-auto flex justify-end border-t border-[var(--rule)] pt-4">
                  <Link
                    href={`/org/rubrics/${rubric.id}/edit`}
                    className="sim-transition shrink-0 rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-center text-[12px] font-semibold text-[var(--muted)] hover:bg-[var(--field)] hover:text-[var(--foreground)]"
                  >
                    Edit rubric
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
