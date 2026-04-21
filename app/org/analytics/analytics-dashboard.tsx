"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { SkillGapHeatmap } from "../_components/skill-gap-heatmap";
import { SkillRadarChart } from "../_components/skill-radar-chart";
import {
  ORG_MEMBER_SKILLS,
  ORG_MEMBERS,
  ORG_SKILL_TARGETS,
  getCohortById,
  getMemberById,
} from "../_lib/org-mock-data";

type CohortSummary = { id: string; name: string; avg: number | null; completion: number };

type Props = {
  cohortSummaries: CohortSummary[];
};

export function AnalyticsDashboard({ cohortSummaries }: Props) {
  const search = useSearchParams();
  const cohortFilter = search.get("cohort");
  const memberId = search.get("member");

  const member = memberId ? getMemberById(memberId) : undefined;
  const profile = memberId ? ORG_MEMBER_SKILLS[memberId] : null;
  const cohort = cohortFilter ? getCohortById(cohortFilter) : null;

  const cohortMembers = useMemo(() => {
    if (!cohortFilter) return ORG_MEMBERS;
    return ORG_MEMBERS.filter((m) => m.cohortId === cohortFilter);
  }, [cohortFilter]);

  return (
    <div className="space-y-10">
      {(cohortFilter || memberId) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--rule)] bg-[var(--field)]/50 px-4 py-3 text-[13px] text-[var(--muted)]">
          <span>
            Filters:{" "}
            {cohort ? <strong className="text-[#111111]">{cohort.name}</strong> : cohortFilter ? cohortFilter : "all cohorts"}
            {member ? (
              <>
                {" · "}
                <strong className="text-[#111111]">{member.name}</strong>
              </>
            ) : null}
          </span>
          <Link href="/org/analytics" className="font-medium text-[#111111] underline underline-offset-2">
            Clear
          </Link>
        </div>
      )}

      <SkillGapHeatmap drillBasePath="/org/analytics" />

      <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Per-student drill-down</h2>
        <p className="mt-2 text-[14px] text-[var(--muted)]">
          Open a learner to compare their skill profile to program targets. Links from cohort skill map use the same
          view.
        </p>

        {memberId && profile && Object.values(profile).some((v) => v > 0) ? (
          <div className="mt-8 flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
            <SkillRadarChart profile={profile} target={ORG_SKILL_TARGETS} size={260} caption={member?.name} />
            <div className="max-w-md space-y-3 text-[14px] text-[var(--muted)]">
              <p>
                Dimensions reflect scored simulation activity in this preview. Wire your scoring pipeline to refresh
                these profiles after each cohort run.
              </p>
              {member?.cohortId ? (
                <p>
                  Cohort:{" "}
                  <Link
                    href={`/org/cohorts/${member.cohortId}`}
                    className="font-medium text-[#111111] underline underline-offset-2"
                  >
                    {getCohortById(member.cohortId)?.name ?? member.cohortId}
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        ) : memberId ? (
          <p className="mt-6 text-[14px] text-[var(--muted)]">No scored skill profile for this learner in preview data.</p>
        ) : null}

        <ul className="mt-8 divide-y divide-[var(--rule)] rounded-xl border border-[var(--rule)]">
          {cohortMembers.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium text-[#111111]">{m.name}</p>
                <p className="text-[12px] text-[var(--faint)]">{m.email}</p>
              </div>
              <Link
                href={`/org/analytics?member=${m.id}${cohortFilter ? `&cohort=${cohortFilter}` : ""}`}
                className="rounded-lg border border-[var(--rule-strong)] px-3 py-1.5 text-[12px] font-medium text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
              >
                View profile
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
