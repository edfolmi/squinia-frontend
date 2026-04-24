"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

import { SkillRadarChart } from "../_components/skill-radar-chart";
import { ORG_MEMBER_SKILLS, ORG_SKILL_TARGETS, getMemberById } from "../_lib/org-mock-data";
import type { OrgSkillProfile } from "../_lib/org-mock-data";

type CohortSummary = { id: string; name: string; avg: number | null; completion: number };

export type MemberLite = { id: string; name: string; email: string; cohortId: string };

type Props = {
  cohortSummaries: CohortSummary[];
  /** When empty, per-student list is hidden. */
  members?: MemberLite[];
};

type UserSummary = { total_sessions: number; avg_score: number | null; trend: string };

export function AnalyticsDashboard({ cohortSummaries, members = [] }: Props) {
  const search = useSearchParams();
  const cohortFilter = search.get("cohort");
  const memberId = search.get("member");

  const cohort = useMemo(
    () => (cohortFilter ? cohortSummaries.find((c) => c.id === cohortFilter) : null),
    [cohortFilter, cohortSummaries],
  );

  const member = memberId ? members.find((m) => m.id === memberId) ?? getMemberById(memberId) : undefined;
  const mockProfile = memberId ? ORG_MEMBER_SKILLS[memberId] : null;

  const [liveSummary, setLiveSummary] = useState<UserSummary | null>(null);

  useEffect(() => {
    if (!memberId) {
      setLiveSummary(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const res = await v1.get<{ summary: UserSummary }>(`analytics/users/${memberId}/summary`);
      if (!cancelled && res.ok) setLiveSummary(res.data.summary);
      else if (!cancelled) setLiveSummary(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const cohortMembers = useMemo(() => {
    if (!members.length) return [];
    if (!cohortFilter) return members;
    return members.filter((m) => m.cohortId === cohortFilter);
  }, [members, cohortFilter]);

  const profile: OrgSkillProfile | null = mockProfile;

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
            ) : memberId ? (
              <>
                {" · "}
                <strong className="font-mono text-[#111111]">{memberId}</strong>
              </>
            ) : null}
          </span>
          <Link href="/org/analytics" className="font-medium text-[#111111] underline underline-offset-2">
            Clear
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Per-student drill-down</h2>
        <p className="mt-2 text-[14px] text-[var(--muted)]">
          Select a member to view their session history, average scores, and skill radar.
        </p>

        {memberId && liveSummary ? (
          <div className="mt-6 rounded-xl border border-[var(--rule)] bg-[var(--field)]/40 px-4 py-3 text-[14px] text-[var(--muted)]">
            <p>
              <strong className="text-[#111111]">{liveSummary.total_sessions}</strong> sessions · avg score{" "}
              <strong className="text-[#111111]">
                {liveSummary.avg_score != null ? Math.round(liveSummary.avg_score) : "—"}
              </strong>{" "}
              · trend <strong className="text-[#111111]">{liveSummary.trend}</strong>
            </p>
          </div>
        ) : null}

        {memberId && profile && Object.values(profile).some((v) => v > 0) ? (
          <div className="mt-8 flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
            <SkillRadarChart profile={profile} target={ORG_SKILL_TARGETS} size={260} caption={member?.name} />
            <div className="max-w-md space-y-3 text-[14px] text-[var(--muted)]">
              <p>Skill radar based on rubric evaluation dimensions.</p>
              {member && "cohortId" in member && member.cohortId ? (
                <p>
                  Cohort:{" "}
                  <Link
                    href={`/org/cohorts/${member.cohortId}`}
                    className="font-medium text-[#111111] underline underline-offset-2"
                  >
                    {cohortSummaries.find((c) => c.id === member.cohortId)?.name ?? member.cohortId}
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        ) : memberId ? (
          <p className="mt-6 text-[14px] text-[var(--muted)]">No skill profile available for this learner yet.</p>
        ) : null}

        {cohortMembers.length ? (
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
        ) : (
          <p className="mt-6 text-[14px] text-[var(--muted)]">
            Member roster for analytics drill-down loads when members are supplied (e.g. from cohort pages).
          </p>
        )}
      </div>
    </div>
  );
}
