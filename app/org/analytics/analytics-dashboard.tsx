"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

type CohortSummary = {
  id: string;
  name: string;
  avg: number | null;
  completion: number;
  ready?: number;
  atRisk?: number;
  active?: number;
  members?: number;
};

export type MemberLite = { id: string; name: string; email: string; cohortId: string };

export type SkillMap = {
  criteria: string[];
  members: Array<Record<string, unknown> & { user_id: string; full_name?: string | null; email?: string | null }>;
};

type Props = {
  cohortSummaries: CohortSummary[];
  members?: MemberLite[];
  skillMaps?: Record<string, SkillMap>;
};

type UserSummary = {
  total_sessions: number;
  avg_score: number | null;
  trend: string;
  weakest_criteria?: string[];
  strongest_criteria?: string[];
};

export function AnalyticsDashboard({ cohortSummaries, members = [], skillMaps = {} }: Props) {
  const search = useSearchParams();
  const cohortFilter = search.get("cohort");
  const memberId = search.get("member");

  const cohort = useMemo(
    () => (cohortFilter ? cohortSummaries.find((c) => c.id === cohortFilter) : null),
    [cohortFilter, cohortSummaries],
  );

  const member = memberId ? members.find((m) => m.id === memberId) : undefined;
  const [liveSummary, setLiveSummary] = useState<UserSummary | null>(null);

  useEffect(() => {
    if (!memberId) {
      void Promise.resolve().then(() => setLiveSummary(null));
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

  const memberSkillRows = useMemo(() => {
    if (!memberId) return [];
    const maps = cohortFilter && skillMaps[cohortFilter] ? [skillMaps[cohortFilter]] : Object.values(skillMaps);
    const rows: Array<{ criterion: string; score: number }> = [];
    for (const map of maps) {
      const row = map.members.find((m) => m.user_id === memberId);
      if (!row) continue;
      for (const criterion of map.criteria) {
        const score = row[criterion];
        if (typeof score === "number" && Number.isFinite(score)) rows.push({ criterion, score });
      }
    }
    return rows.sort((a, b) => a.score - b.score);
  }, [cohortFilter, memberId, skillMaps]);

  return (
    <div className="space-y-6">
      {(cohortFilter || memberId) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--rule)] bg-[var(--field)]/50 px-4 py-3 text-[13px] text-[var(--muted)]">
          <span>
            Filters:{" "}
            {cohort ? <strong className="text-[#111111]">{cohort.name}</strong> : cohortFilter ? cohortFilter : "all cohorts"}
            {member ? (
              <>
                {" / "}
                <strong className="text-[#111111]">{member.name}</strong>
              </>
            ) : memberId ? (
              <>
                {" / "}
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
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Learner drill-down</h2>
        <p className="mt-2 text-[14px] text-[var(--muted)]">
          Select a learner to inspect session volume, score trend, strongest skills, and weakest rubric criteria.
        </p>

        {memberId && liveSummary ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SummaryTile label="Sessions" value={`${liveSummary.total_sessions}`} />
            <SummaryTile label="Avg score" value={liveSummary.avg_score != null ? `${Math.round(liveSummary.avg_score)}%` : "-"} />
            <SummaryTile label="Trend" value={liveSummary.trend} />
          </div>
        ) : null}

        {memberId ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <SkillList title="Weakest criteria" rows={memberSkillRows.slice(0, 5)} empty="No weak criteria yet." />
            <SkillList title="Strongest criteria" rows={[...memberSkillRows].reverse().slice(0, 5)} empty="No strengths yet." />
          </div>
        ) : null}

        {cohortMembers.length ? (
          <ul className="mt-8 divide-y divide-[var(--rule)] rounded-xl border border-[var(--rule)]">
            {cohortMembers.map((m) => (
              <li key={`${m.cohortId}-${m.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
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
            Invite learners to cohorts and complete scored simulations to unlock learner drill-down.
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/40 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#111111]">{value}</p>
    </div>
  );
}

function SkillList({ title, rows, empty }: { title: string; rows: Array<{ criterion: string; score: number }>; empty: string }) {
  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">{title}</h3>
      {rows.length ? (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={`${title}-${row.criterion}`} className="grid grid-cols-[1fr_52px] items-center gap-3 text-[13px]">
              <div>
                <p className="truncate font-medium text-[#111111]">{row.criterion}</p>
                <div className="mt-1 h-1.5 rounded-full bg-[var(--field)]">
                  <div className="h-1.5 rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, Math.max(0, row.score))}%` }} />
                </div>
              </div>
              <span className="text-right font-mono tabular-nums text-[var(--muted)]">{Math.round(row.score)}%</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-[var(--muted)]">{empty}</p>
      )}
    </div>
  );
}
