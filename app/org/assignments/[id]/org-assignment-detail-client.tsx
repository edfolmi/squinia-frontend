"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

import { OrgSubmissionsGradingTable } from "./org-submissions-grading-table";

type AssignmentApi = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  assigned_to?: string;
};

type SubmissionApi = {
  id?: string;
  submitted_at?: string | null;
  grade?: number | null;
  feedback?: string | null;
  status?: string;
} | null;

export function OrgAssignmentDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignmentApi | null>(null);
  const [submission, setSubmission] = useState<SubmissionApi>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const res = await v1.get<{ assignment: AssignmentApi; submission: SubmissionApi }>(`assignments/${id}`);
    if (!res.ok) {
      setError(res.message);
      setAssignment(null);
      setSubmission(null);
    } else {
      setAssignment(res.data.assignment);
      setSubmission(res.data.submission ?? null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  if (!id) return <p className="text-[14px] text-[var(--muted)]">Missing id.</p>;
  if (loading) return <p className="text-[14px] text-[var(--muted)]">Loading…</p>;
  if (!assignment) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <p className="text-amber-900">{error ?? "Not found"}</p>
        <Link href="/org/assignments" className="underline">
          Back
        </Link>
      </div>
    );
  }

  const rows =
    submission && assignment.assigned_to
      ? [
          {
            id: submission.id ?? "sub-1",
            memberName: `User ${assignment.assigned_to.slice(0, 8)}…`,
            submittedAt: submission.submitted_at ?? new Date().toISOString(),
            reportScore: submission.grade ?? null,
            notes: typeof submission.feedback === "string" ? submission.feedback : "",
            gradeManual: submission.grade ?? null,
            status: (submission.status?.toLowerCase() === "graded" ? "graded" : "pending") as "graded" | "pending",
          },
        ]
      : [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/org/assignments"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Assignments
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">{assignment.title}</h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--faint)]">
          {assignment.due_at ? (
            <>
              Due{" "}
              <time dateTime={assignment.due_at}>
                {new Date(assignment.due_at).toLocaleString(undefined, {
                  weekday: "short",
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
        <p className="mt-4 text-[14px] text-[var(--muted)]">
          Status: <span className="font-medium text-[#111111]">{assignment.status.replace(/_/g, " ")}</span>
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Submissions & grading</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">
          One submission row per assignment detail response. Extend when the API lists all cohort submissions.
        </p>
        <div className="mt-6">
          {rows.length ? (
            <OrgSubmissionsGradingTable submissions={rows} />
          ) : (
            <p className="text-[14px] text-[var(--muted)]">No submission on record for this assignment.</p>
          )}
        </div>
      </section>
    </div>
  );
}
