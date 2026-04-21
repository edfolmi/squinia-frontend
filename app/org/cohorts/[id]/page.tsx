import Link from "next/link";
import { notFound } from "next/navigation";

import {
  averageSkillProfileForCohort,
  cohortAverageScore,
  cohortCompletionRate,
  getCohortById,
  getMembersForCohort,
  getProgressForCohort,
  ORG_SKILL_TARGETS,
} from "../../_lib/org-mock-data";

import { CohortDetailTabs } from "./cohort-detail-tabs";

export default async function OrgCohortDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const cohort = getCohortById(id);
  if (!cohort) notFound();

  const members = getMembersForCohort(cohort.id);
  const progress = getProgressForCohort(cohort.id);
  const avg = cohortAverageScore(cohort.id);
  const completion = cohortCompletionRate(cohort.id);
  const skillAvg = averageSkillProfileForCohort(cohort.id);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link
          href="/org/cohorts"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Cohorts
        </Link>
        {sp.created ? (
          <p className="mt-3 rounded-xl border border-[#166534]/30 bg-[#e6f4ea]/50 px-4 py-2 text-[13px] text-[#166534]">
            Preview: showing an existing cohort. Your API would create the cohort you named and return its id.
          </p>
        ) : null}
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">{cohort.name}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">{cohort.description}</p>
        <div className="mt-4 flex flex-wrap gap-6 font-mono text-[12px] tabular-nums">
          <p className="text-[var(--muted)]">
            <span className="text-[var(--faint)]">Avg score</span>{" "}
            <span className="ml-1 font-medium text-[#166534]">{avg != null ? `${avg}%` : "—"}</span>
          </p>
          <p className="text-[var(--muted)]">
            <span className="text-[var(--faint)]">Completion</span>{" "}
            <span className="ml-1 font-medium text-[#111111]">{completion}%</span>
          </p>
          <p className="text-[var(--muted)]">
            <span className="text-[var(--faint)]">Program</span>{" "}
            <span className="ml-1 font-medium text-[#111111]">{cohort.programWeeks} weeks</span>
          </p>
        </div>
      </div>

      <CohortDetailTabs
        cohortId={cohort.id}
        members={members}
        progress={progress}
        skillAverage={skillAvg}
        skillTargets={ORG_SKILL_TARGETS}
      />
    </div>
  );
}
