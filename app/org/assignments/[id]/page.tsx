import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getAssignmentById,
  getCohortById,
  getMemberById,
  getScenarioById,
  getSubmissionsForAssignment,
} from "../../_lib/org-mock-data";

import { OrgSubmissionsGradingTable } from "./org-submissions-grading-table";

export default async function OrgAssignmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const assignment = getAssignmentById(id);
  if (!assignment) notFound();

  const cohort = getCohortById(assignment.cohortId);
  const scenario = getScenarioById(assignment.scenarioId);
  const submissions = getSubmissionsForAssignment(assignment.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/org/assignments"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Assignments
        </Link>
        {sp.created ? (
          <p className="mt-3 rounded-xl border border-[#166534]/30 bg-[#e6f4ea]/50 px-4 py-2 text-[13px] text-[#166534]">
            Preview: opened a seeded assignment with submissions. Your API would create the record you submitted.
          </p>
        ) : null}
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">{assignment.title}</h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--faint)]">
          Due{" "}
          <time dateTime={assignment.dueAt}>
            {new Date(assignment.dueAt).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-[14px] text-[var(--muted)]">
          <span>
            Cohort: <span className="font-medium text-[#111111]">{cohort?.name ?? assignment.cohortId}</span>
          </span>
          <span>
            Scenario: <span className="font-medium text-[#111111]">{scenario?.title ?? assignment.scenarioId}</span>
          </span>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Submissions & grading</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">
          Report score comes from the simulation artifact; add a manual grade and notes for the record.
        </p>
        <div className="mt-6">
          <OrgSubmissionsGradingTable
            submissions={submissions.map((s) => ({
              ...s,
              memberName: getMemberById(s.memberId)?.name ?? s.memberId,
            }))}
          />
        </div>
      </section>
    </div>
  );
}
