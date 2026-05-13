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

type AttemptApi = {
  id: string;
  status: string;
  mode: string;
  started_at?: string | null;
  ended_at?: string | null;
  updated_at?: string | null;
  learner?: {
    full_name?: string | null;
    email?: string | null;
  };
  evaluation?: {
    status?: string | null;
    overall_score?: number | null;
  } | null;
};

type SubmissionApi = {
  id?: string;
  submitted_at?: string | null;
  grade?: number | null;
  feedback?: string | null;
  status?: string;
} | null;

function assignmentStatusLabel(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "PENDING") return "Awaiting learner action";
  if (normalized === "IN_PROGRESS") return "In progress";
  if (normalized === "SUBMITTED") return "Submitted";
  if (normalized === "GRADED") return "Graded";
  if (normalized === "OVERDUE") return "Overdue";
  return status.replace(/_/g, " ");
}

export function OrgAssignmentDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignmentApi | null>(null);
  const [submission, setSubmission] = useState<SubmissionApi>(null);
  const [attempts, setAttempts] = useState<AttemptApi[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const res = await v1.get<{ assignment: AssignmentApi; submission: SubmissionApi; attempts?: AttemptApi[] }>(`assignments/${id}`);
    if (!res.ok) {
      setError(res.message);
      setAssignment(null);
      setSubmission(null);
      setAttempts([]);
    } else {
      setAssignment(res.data.assignment);
      setSubmission(res.data.submission ?? null);
      setAttempts(res.data.attempts ?? []);
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

  const attemptRows = attempts.map((attempt, index) => ({
    id: attempt.id,
    learner: attempt.learner?.full_name || attempt.learner?.email || (assignment.assigned_to ? `User ${assignment.assigned_to.slice(0, 8)}...` : `Learner ${index + 1}`),
    timestamp: attempt.ended_at ?? attempt.started_at ?? attempt.updated_at ?? "",
    status: attempt.status.replace(/_/g, " ").toLowerCase(),
    mode: attempt.mode.toLowerCase(),
    score: attempt.evaluation?.overall_score ?? null,
    evaluationStatus: attempt.evaluation?.status?.replace(/_/g, " ").toLowerCase() ?? "not evaluated",
  }));

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
          Status: <span className="font-medium text-[#111111]">{assignmentStatusLabel(assignment.status)}</span>
        </p>
        <p className="mt-2 text-[13px] leading-6 text-[var(--muted)]">
          Learners can see this assignment while it is awaiting action. The status changes after learner activity or submission.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Simulation attempts</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">
          Attempts appear here as soon as a learner starts the assigned simulation. Written follow-up is tracked separately below.
        </p>
        {attemptRows.length ? (
          <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--rule)]">
            <table className="w-full min-w-[680px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--rule)] bg-[var(--field)]/60 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  <th className="px-3 py-3 font-medium">Learner</th>
                  <th className="px-3 py-3 font-medium">Attempt</th>
                  <th className="px-3 py-3 font-medium">Mode</th>
                  <th className="px-3 py-3 font-medium">Score</th>
                  <th className="px-3 py-3 font-medium">Evaluation</th>
                  <th className="px-3 py-3 font-medium">Report</th>
                </tr>
              </thead>
              <tbody>
                {attemptRows.map((attempt) => (
                  <tr key={attempt.id} className="border-b border-[var(--rule)] last:border-0">
                    <td className="px-3 py-3 font-medium text-[#111111]">{attempt.learner}</td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      {attempt.timestamp
                        ? new Date(attempt.timestamp).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "Started"}
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--faint)]">{attempt.status}</span>
                    </td>
                    <td className="px-3 py-3 capitalize text-[var(--muted)]">{attempt.mode}</td>
                    <td className="px-3 py-3 font-mono tabular-nums text-[#166534]">{attempt.score != null ? `${attempt.score}%` : "--"}</td>
                    <td className="px-3 py-3 capitalize text-[var(--muted)]">{attempt.evaluationStatus}</td>
                    <td className="px-3 py-3">
                      <Link href={`/simulation/${attempt.id}/report`} className="font-medium text-[#111111] underline underline-offset-2">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 text-[14px] text-[var(--muted)]">No learner has started the assigned simulation yet.</p>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Submissions & grading</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">
          Written learner follow-up appears here after the learner submits notes for the assignment.
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
