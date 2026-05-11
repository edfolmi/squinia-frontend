"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MetricCard, ProductPageHeader, StatusBadge } from "@/app/_components/product-ui";
import { v1, type ItemsData } from "@/app/_lib/v1-client";

type AssignmentApi = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  assigned_to?: string;
};

function dueLabel(value: string | null): string {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return `Due ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function statusTone(status: string): "success" | "warning" | "neutral" {
  const normalized = status.toUpperCase();
  if (normalized.includes("COMPLETE") || normalized.includes("GRADED")) return "success";
  if (normalized.includes("DUE") || normalized.includes("PENDING")) return "warning";
  return "neutral";
}

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
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const stats = useMemo(() => {
    const withDueDate = items.filter((item) => item.due_at).length;
    const pending = items.filter((item) => statusTone(item.status) === "warning").length;
    return { withDueDate, pending };
  }, [items]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ProductPageHeader
        eyebrow="Cohort delivery"
        title="Assignments"
        description="Track practice work across your organisation and keep follow-up tied to cohorts and scenarios."
        action={
          <Link
            href="/org/assignments/new"
            className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto"
          >
            New assignment
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Assignments" value={loading ? "--" : items.length} detail="Total created" />
        <MetricCard label="Pending" value={loading ? "--" : stats.pending} detail="Need learner action" tone={stats.pending ? "warning" : "success"} />
        <MetricCard label="Scheduled" value={loading ? "--" : stats.withDueDate} detail="With due dates" />
      </section>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-[var(--warning-soft)] px-4 py-3 text-[14px] text-amber-950">{error}</p>
      ) : null}

      {loading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="squinia-card p-5">
              <div className="squinia-skeleton h-5 w-56 rounded-lg" />
              <div className="squinia-skeleton mt-3 h-4 w-2/3 rounded-lg" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--rule-strong)] bg-[var(--surface)] p-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">No assignments yet</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-6 text-[var(--muted)]">
            Assign a scenario to a cohort when you want structured submissions and progress tracking.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((assignment) => (
            <li key={assignment.id}>
              <Link
                href={`/org/assignments/${assignment.id}`}
                className="sim-transition block h-full rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:border-[var(--rule-strong)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--foreground)]">{assignment.title}</p>
                    <p className="mt-2 text-[13px] text-[var(--muted)]">
                      {assignment.assigned_to ? `Assigned to ${assignment.assigned_to.slice(0, 8)}` : "Assigned by cohort or learner rules"}
                    </p>
                  </div>
                  <StatusBadge tone={statusTone(assignment.status)}>{assignment.status.replace(/_/g, " ")}</StatusBadge>
                </div>
                <p className="mt-5 border-t border-[var(--rule)] pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  {dueLabel(assignment.due_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
