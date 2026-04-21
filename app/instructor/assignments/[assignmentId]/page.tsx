import Link from "next/link";
import { notFound } from "next/navigation";

import { getAssignmentById, getScenarioById } from "@/app/(student)/_lib/student-mock-data";

import { InstructorAssignmentRulesForm } from "./instructor-assignment-rules-form";

export default async function InstructorAssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const assignment = getAssignmentById(assignmentId);
  if (!assignment) notFound();
  const scenario = getScenarioById(assignment.scenarioId);

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
          Simulation rules · {assignment.title}
        </h1>
        <p className="mt-2 text-[14px] text-[var(--muted)]">{assignment.cohort}</p>
        {scenario ? (
          <p className="mt-3 text-[13px] text-[var(--faint)]">
            Linked scenario: <span className="text-[var(--muted)]">{scenario.title}</span> (
            {scenario.kind})
          </p>
        ) : null}
      </div>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Attempts & score floor</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--muted)]">
          These limits apply to the assigned simulation only. Mock defaults live in code; saving here writes a browser
          override so you can preview the student assignment page in the same browser.
        </p>
        <div className="mt-6">
          <InstructorAssignmentRulesForm assignment={assignment} />
        </div>
      </section>

      <p className="text-[13px] text-[var(--muted)]">
        Student link:{" "}
        <Link href={`/assignments/${assignment.id}`} className="font-medium text-[#111111] underline underline-offset-2">
          /assignments/{assignment.id}
        </Link>
      </p>
    </div>
  );
}
