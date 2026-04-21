import Link from "next/link";

import { ORG_COHORTS, cohortAverageScore, cohortCompletionRate, getMembersForCohort } from "../_lib/org-mock-data";

export default function OrgCohortsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Cohorts</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
            Create cohorts, invite learners, and track progress. Preview data only — wire your tenant API and SSO
            before onboarding customers.
          </p>
        </div>
        <Link
          href="/org/cohorts/new"
          className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto"
        >
          Create cohort
        </Link>
      </div>

      <ul className="space-y-3">
        {ORG_COHORTS.map((c) => {
          const members = getMembersForCohort(c.id);
          const avg = cohortAverageScore(c.id);
          const completion = cohortCompletionRate(c.id);
          return (
            <li key={c.id}>
              <Link
                href={`/org/cohorts/${c.id}`}
                className="block rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_4px_24px_-16px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_32px_-16px_rgba(0,0,0,0.1)] sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">{c.name}</h2>
                    <p className="mt-1 text-[14px] text-[var(--muted)]">{c.description}</p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                      {members.length} members · {c.programWeeks} weeks · created{" "}
                      {new Date(c.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-6 font-mono text-[12px] tabular-nums sm:text-right">
                    <div>
                      <p className="text-[var(--faint)]">Avg score</p>
                      <p className="mt-0.5 font-medium text-[#166534]">{avg != null ? `${avg}%` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[var(--faint)]">Completion</p>
                      <p className="mt-0.5 font-medium text-[#111111]">{completion}%</p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
