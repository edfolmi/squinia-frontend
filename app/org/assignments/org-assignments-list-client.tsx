"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { v1, type ItemsData } from "@/app/_lib/v1-client";

type AssignmentApi = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  assigned_to?: string;
};

export function OrgAssignmentsListClient() {
  const [items, setItems] = useState<AssignmentApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<ItemsData<AssignmentApi>>("assignments", { limit: 50, page: 1 });
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
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Assignments</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
            Tenant assignments from <span className="font-mono text-[11px]">GET /api/v1/assignments</span>.
          </p>
        </div>
        <Link
          href="/org/assignments/new"
          className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto"
        >
          New assignment
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[14px] text-[var(--muted)]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-[14px] text-[var(--muted)]">No assignments yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={`/org/assignments/${a.id}`}
                className="block rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 transition-shadow hover:shadow-[0_8px_32px_-16px_rgba(0,0,0,0.1)]"
              >
                <p className="font-medium text-[#111111]">{a.title}</p>
                <p className="mt-1 text-[13px] text-[var(--muted)]">
                  {a.status.replace(/_/g, " ")}
                  {a.assigned_to ? ` · assigned to ${a.assigned_to.slice(0, 8)}…` : null}
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  {a.due_at
                    ? `Due ${new Date(a.due_at).toLocaleDateString()}`
                    : "No due date"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
