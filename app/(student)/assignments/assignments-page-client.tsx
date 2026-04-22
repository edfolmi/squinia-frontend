"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { v1, type ItemsData } from "@/app/_lib/v1-client";

import { assignmentSimulationKindLabel, type SimulationKind } from "../_lib/student-mock-data";

type AssignmentApi = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  type: string;
  content?: Record<string, unknown>;
};

function statusLabel(s: string) {
  const x = s.toLowerCase();
  if (x === "pending") return "Pending";
  if (x === "in_progress") return "In progress";
  if (x === "submitted") return "Submitted";
  if (x === "graded") return "Graded";
  if (x === "overdue") return "Overdue";
  return s;
}

function statusClass(s: string) {
  const x = s.toLowerCase();
  if (x === "pending" || x === "in_progress") return "bg-amber-50 text-[#a16207]";
  if (x === "submitted") return "bg-[var(--field)] text-[var(--muted)]";
  if (x === "graded") return "bg-[#e6f4ea] text-[#166534]";
  if (x === "overdue") return "bg-red-50 text-red-800";
  return "bg-[var(--field)] text-[var(--muted)]";
}

function inferKind(content: Record<string, unknown> | undefined): SimulationKind {
  const m = content?.modality;
  if (m === "VOICE" || m === "phone") return "phone";
  if (m === "VIDEO" || m === "video") return "video";
  return "chat";
}

export function AssignmentsPageClient() {
  const [items, setItems] = useState<AssignmentApi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<ItemsData<AssignmentApi>>("assignments", { assigned_to_me: true, limit: 50, page: 1 });
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
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Assigned simulations</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Work your instructor assigned in this tenant. Open a row for details and to start the linked simulation.
        </p>
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
          {items.map((a) => {
            const kind = inferKind(a.content);
            return (
              <li key={a.id}>
                <Link
                  href={`/assignments/${a.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-4 shadow-[0_4px_24px_-16px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_32px_-16px_rgba(0,0,0,0.1)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#111111]">{a.title}</p>
                      <span className="rounded-full border border-[var(--rule)] bg-[var(--field)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)]">
                        {assignmentSimulationKindLabel(kind)}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-[var(--muted)]">{a.type.replace(/_/g, " ")}</p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                      {a.due_at ? (
                        <>
                          Due{" "}
                          <time dateTime={a.due_at}>
                            {new Date(a.due_at).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </time>
                        </>
                      ) : (
                        "No due date"
                      )}
                    </p>
                  </div>
                  <span
                    className={`self-start rounded-full px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] sm:self-auto ${statusClass(a.status)}`}
                  >
                    {statusLabel(a.status)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
