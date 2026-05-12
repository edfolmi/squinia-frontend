"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { v1, type ItemsData } from "@/app/_lib/v1-client";

import { assignmentSimulationKindLabel, type SimulationKind } from "@/app/(student)/_lib/student-mock-data";

type AssignmentApi = {
  id: string;
  title: string;
  content?: Record<string, unknown>;
};

function inferKind(content: Record<string, unknown> | undefined): SimulationKind {
  const m = content?.modality;
  if (m === "VOICE" || m === "phone") return "phone";
  if (m === "VIDEO" || m === "video") return "video";
  return "chat";
}

export function InstructorAssignmentsClient() {
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
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Assigned simulations</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Assignments in your tenant (same list as org operators). Open a row to adjust rules in the browser.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-[14px] text-[var(--muted)]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-[14px] text-[var(--muted)]">No assignments.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const kind = inferKind(a.content);
            return (
              <li key={a.id}>
                <Link
                  href={`/instructor/assignments/${a.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-4 shadow-[0_4px_24px_-16px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_32px_-16px_rgba(0,0,0,0.1)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#111111]">{a.title}</p>
                      <span className="rounded-full border border-[var(--rule)] bg-[var(--field)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)]">
                        {assignmentSimulationKindLabel(kind)}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                      Custom rules set by instructor.
                    </p>
                  </div>
                  <span className="self-start text-[12px] font-medium text-[var(--muted)] sm:self-auto">Edit rules →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
