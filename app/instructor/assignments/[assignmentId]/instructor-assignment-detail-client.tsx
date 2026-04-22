"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

import type { AssignmentRow } from "@/app/(student)/_lib/student-mock-data";

import { InstructorAssignmentRulesForm } from "./instructor-assignment-rules-form";

type AssignmentApi = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  type: string;
  content?: Record<string, unknown>;
};

function contentNum(c: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!c) return fallback;
  const v = c[key];
  return typeof v === "number" ? v : fallback;
}

function contentStr(c: Record<string, unknown> | undefined, key: string, fallback: string): string {
  if (!c) return fallback;
  const v = c[key];
  return typeof v === "string" && v.length ? v : fallback;
}

function mapAssignmentStatus(s: string): AssignmentRow["status"] {
  const x = s.toUpperCase();
  if (x === "SUBMITTED") return "submitted";
  if (x === "GRADED") return "graded";
  return "pending";
}

export function InstructorAssignmentDetailClient() {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = params.assignmentId;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<AssignmentRow | null>(null);
  const [scenarioTitle, setScenarioTitle] = useState<string | null>(null);
  const [kind, setKind] = useState<string>("chat");

  const load = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    const det = await v1.get<{ assignment: AssignmentApi }>(`assignments/${assignmentId}`);
    if (!det.ok) {
      setError(det.message);
      setRow(null);
      setLoading(false);
      return;
    }
    const a = det.data.assignment;
    const r: AssignmentRow = {
      id: a.id,
      title: a.title,
      cohort: contentStr(a.content, "cohort_name", "Assignment"),
      scenarioId: contentStr(a.content, "scenario_id", "unknown"),
      kind: "chat",
      dueAt: a.due_at ?? new Date().toISOString(),
      status: mapAssignmentStatus(a.status),
      points: contentNum(a.content, "points", 10),
      maxAttempts: contentNum(a.content, "max_attempts", 5),
      minScorePercent: contentNum(a.content, "min_score_percent", 70),
    };
    setRow(r);

    const sid = typeof a.content?.scenario_id === "string" ? a.content.scenario_id : null;
    if (sid) {
      const sc = await v1.get<{ scenario: { title?: string } }>(`scenarios/${sid}`);
      if (sc.ok) {
        setScenarioTitle(sc.data.scenario.title ?? null);
        setKind("chat");
      }
    } else {
      setScenarioTitle(null);
    }
    setLoading(false);
  }, [assignmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!assignmentId) return <p className="text-[14px] text-[var(--muted)]">Missing id.</p>;
  if (loading) return <p className="text-[14px] text-[var(--muted)]">Loading…</p>;
  if (!row) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-amber-900">{error ?? "Not found"}</p>
        <Link href="/instructor/assignments" className="underline">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/instructor/assignments"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Instructor assignments
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">
          Simulation rules · {row.title}
        </h1>
        <p className="mt-2 text-[14px] text-[var(--muted)]">{row.cohort}</p>
        {scenarioTitle ? (
          <p className="mt-3 text-[13px] text-[var(--faint)]">
            Linked scenario: <span className="text-[var(--muted)]">{scenarioTitle}</span> ({kind})
          </p>
        ) : null}
      </div>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Attempts & score floor</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--muted)]">
          Browser-only overrides until assignment rules are persisted via API.
        </p>
        <div className="mt-6">
          <InstructorAssignmentRulesForm assignment={row} />
        </div>
      </section>

      <p className="text-[13px] text-[var(--muted)]">
        Student link:{" "}
        <Link href={`/assignments/${row.id}`} className="font-medium text-[#111111] underline underline-offset-2">
          /assignments/{row.id}
        </Link>
      </p>
    </div>
  );
}
