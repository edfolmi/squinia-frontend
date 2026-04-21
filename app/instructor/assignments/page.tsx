import Link from "next/link";

import { ASSIGNMENTS, assignmentSimulationKindLabel } from "@/app/(student)/_lib/student-mock-data";

export default function InstructorAssignmentsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Assigned simulations</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Set how many attempts learners may take and the minimum report score (percentage) you expect after a run.
          Saves to this browser only until your API replaces preview data.
        </p>
      </div>

      <ul className="space-y-3">
        {ASSIGNMENTS.map((a) => (
          <li key={a.id}>
            <Link
              href={`/instructor/assignments/${a.id}`}
              className="flex flex-col gap-2 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-4 shadow-[0_4px_24px_-16px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_32px_-16px_rgba(0,0,0,0.1)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[#111111]">{a.title}</p>
                  <span className="rounded-full border border-[var(--rule)] bg-[var(--field)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)]">
                    {assignmentSimulationKindLabel(a.kind)}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-[var(--muted)]">{a.cohort}</p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  Max {a.maxAttempts} attempts · min score {a.minScorePercent}%
                </p>
              </div>
              <span className="self-start text-[12px] font-medium text-[var(--muted)] sm:self-auto">Edit rules →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
