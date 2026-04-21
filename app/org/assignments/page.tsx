import Link from "next/link";

import { ORG_ASSIGNMENTS, getCohortById, getScenarioById } from "../_lib/org-mock-data";

export default function OrgAssignmentsIndexPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Assignments</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
            Post-session tasks and manual grading queue. Preview list — your API would paginate and filter.
          </p>
        </div>
        <Link
          href="/org/assignments/new"
          className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto"
        >
          New assignment
        </Link>
      </div>
      <ul className="space-y-3">
        {ORG_ASSIGNMENTS.map((a) => {
          const cohort = getCohortById(a.cohortId);
          const scenario = getScenarioById(a.scenarioId);
          return (
            <li key={a.id}>
              <Link
                href={`/org/assignments/${a.id}`}
                className="block rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 transition-shadow hover:shadow-[0_8px_32px_-16px_rgba(0,0,0,0.1)]"
              >
                <p className="font-medium text-[#111111]">{a.title}</p>
                <p className="mt-1 text-[13px] text-[var(--muted)]">
                  {cohort?.name} · {scenario?.title}
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  Due {new Date(a.dueAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
