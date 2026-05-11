"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";

import { LineChart, MetricCard } from "@/app/_components/product-ui";
import { v1 } from "@/app/_lib/v1-client";

import { SkillRadarChart } from "../../_components/skill-radar-chart";
import type { OrgSkillProfile } from "../../_lib/org-mock-data";
import { ORG_SKILL_TARGETS } from "../../_lib/org-mock-data";

const TABS = ["Members", "Progress", "Skill map"] as const;

export type CohortMemberVm = {
  id: string;
  name: string;
  email: string;
  invitedAt: string;
  status: "active" | "pending";
};

export type ProgressRowVm = {
  memberId: string;
  scenarioTitle: string;
  attempts: number;
  bestScore: number | null;
  completed: boolean;
};

export type SkillMapVm = {
  criteria: string[];
  members: Array<Record<string, unknown> & { user_id: string; full_name?: string | null; email?: string | null }>;
};

export type CohortInterventionVm = {
  userId: string;
  name: string;
  email: string;
  riskLevel: string;
  reasons: string[];
  latestScore: number | null;
  lastActivityAt: string | null;
  incompleteSessions: number;
  weakCriteria: string[];
};

type CohortOverviewVm = {
  ready_learners?: number;
  at_risk_learners?: number;
  active_learners_this_week?: number;
  inactive_learners?: number;
  avg_attempts_per_learner?: number;
  avg_improvement?: number | null;
};

type Props = {
  cohortId: string;
  members: CohortMemberVm[];
  progress: ProgressRowVm[];
  skillAverage: OrgSkillProfile | null;
  skillMap: SkillMapVm | null;
  interventions: CohortInterventionVm[];
  overview: CohortOverviewVm | null;
  onChanged: () => void;
};

export function CohortDetailTabs({ cohortId, members, progress, skillAverage, skillMap, interventions, overview, onChanged }: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Members");

  const progressRows = useMemo(() => {
    const byMember = new Map<string, ProgressRowVm[]>();
    for (const p of progress) {
      const list = byMember.get(p.memberId) ?? [];
      list.push(p);
      byMember.set(p.memberId, list);
    }
    return members.map((m) => ({ member: m, rows: byMember.get(m.id) ?? [] }));
  }, [members, progress]);
  const scoreTrend = useMemo(
    () =>
      progress
        .filter((row) => row.bestScore != null)
        .slice(0, 10)
        .map((row, index) => ({ label: `R${index + 1}`, value: row.bestScore })),
    [progress],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-xl border border-[var(--rule)] bg-[var(--field)]/50 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
              tab === t ? "bg-[var(--surface)] text-[#111111] shadow-sm ring-1 ring-[var(--rule-strong)]" : "text-[var(--muted)] hover:text-[#111111]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Members" ? (
        <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex flex-col gap-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Student list</h2>
            <BulkInvitePanel cohortId={cohortId} onChanged={onChanged} />
          </div>
          <ul className="mt-5 divide-y divide-[var(--rule)]">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0">
                <div>
                  <p className="font-medium text-[#111111]">{m.name}</p>
                  <p className="mt-0.5 text-[13px] text-[var(--muted)]">{m.email}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--faint)]">
                    Joined {new Date(m.invitedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ${
                      m.status === "active" ? "bg-[#e6f4ea] text-[#166534]" : "bg-amber-50 text-[#a16207]"
                    }`}
                  >
                    {m.status}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Remove ${m.email} from this cohort?`)) return;
                      const res = await v1.delete(`cohorts/${cohortId}/members/${m.id}`);
                      if (res.ok) onChanged();
                      else window.alert(res.message);
                    }}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-[12px] font-medium text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "Progress" ? (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Ready" value={`${overview?.ready_learners ?? 0}`} detail="At or above threshold" tone="success" />
            <MetricCard label="At risk" value={`${overview?.at_risk_learners ?? 0}`} detail="Needs attention" tone={(overview?.at_risk_learners ?? 0) > 0 ? "danger" : "success"} />
            <MetricCard label="Active" value={`${overview?.active_learners_this_week ?? 0}`} detail="This week" />
          </div>

          <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Cohort score trend</h2>
                <p className="mt-1 text-[13px] text-[var(--muted)]">Best-score samples from cohort progress rows.</p>
              </div>
              <span className="font-mono text-[11px] text-[var(--faint)]">{scoreTrend.length} samples</span>
            </div>
            <div className="mt-5">
              <LineChart points={scoreTrend} ariaLabel="Cohort score trend" height={175} />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--rule)] bg-[var(--surface)]">
            <div className="border-b border-[var(--rule)] bg-[var(--field)]/60 px-4 py-3 sm:px-5">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Progress by student</h2>
              <p className="mt-1 text-[13px] text-[var(--muted)]">Aggregates from the cohort progress API.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--rule)] font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Scenario</th>
                    <th className="px-4 py-3 font-medium">Attempts</th>
                    <th className="px-4 py-3 font-medium">Best</th>
                    <th className="px-4 py-3 font-medium">Done</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.map((p) => {
                    const mem = members.find((m) => m.id === p.memberId);
                    return (
                      <tr key={`${p.memberId}-${p.scenarioTitle}`} className="border-b border-[var(--rule)] last:border-0">
                        <td className="px-4 py-3 font-medium text-[#111111]">{mem?.name ?? p.memberId}</td>
                        <td className="px-4 py-3 text-[var(--muted)]">{p.scenarioTitle}</td>
                        <td className="px-4 py-3 font-mono tabular-nums">{p.attempts}</td>
                        <td className="px-4 py-3 font-mono tabular-nums text-[#166534]">
                          {p.bestScore != null ? `${p.bestScore}%` : "-"}
                        </td>
                        <td className="px-4 py-3">{p.completed ? "Yes" : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Recommended interventions</h2>
            {interventions.length ? (
              <ul className="mt-4 divide-y divide-[var(--rule)]">
                {interventions.map((item) => (
                  <li key={item.userId} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#111111]">{item.name}</p>
                        <p className="mt-1 text-[12px] text-[var(--muted)]">{item.reasons.join(" / ")}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase ${item.riskLevel === "high" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                        {item.riskLevel}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[14px] text-[var(--muted)]">No recommended interventions for this cohort.</p>
            )}
          </div>
        </section>
      ) : null}

      {tab === "Skill map" ? (
        <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Cohort skill map</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--muted)]">
            Radar shows cohort average vs program targets when analytics returns skill dimensions.
          </p>
          <div className="mt-8 flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center">
            {skillAverage ? (
              <SkillRadarChart
                profile={skillAverage}
                target={ORG_SKILL_TARGETS}
                size={260}
                caption="Cohort average vs target profile"
              />
            ) : (
              <p className="text-[14px] text-[var(--muted)]">Not enough scored activity to chart this cohort.</p>
            )}
            <div className="w-full max-w-md space-y-4">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">Criteria averages</h3>
              {skillMap?.criteria.length ? <CriteriaAverages skillMap={skillMap} /> : null}
              <h3 className="pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">Per student</h3>
              <ul className="space-y-3">
                {progressRows.map(({ member, rows }) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--rule)] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[#111111]">{member.name}</p>
                      <p className="text-[11px] text-[var(--faint)]">{rows.length} tracked rows</p>
                    </div>
                    <a
                      href={`/org/analytics?member=${member.id}&cohort=${cohortId}`}
                      className="shrink-0 rounded-lg border border-[var(--rule-strong)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
                    >
                      Drill down
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CriteriaAverages({ skillMap }: { skillMap: SkillMapVm }) {
  const rows = skillMap.criteria
    .map((criterion) => {
      const values = skillMap.members
        .map((member) => member[criterion])
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
      const avg = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
      return { criterion, avg };
    })
    .filter((row) => row.avg != null)
    .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0))
    .slice(0, 8);

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.criterion} className="grid grid-cols-[1fr_48px] items-center gap-3 text-[12px]">
          <div>
            <p className="truncate font-medium text-[#111111]">{row.criterion}</p>
            <div className="mt-1 h-1.5 rounded-full bg-[var(--field)]">
              <div className="h-1.5 rounded-full bg-[var(--accent)]" style={{ width: `${row.avg ?? 0}%` }} />
            </div>
          </div>
          <span className="text-right font-mono tabular-nums text-[var(--muted)]">{row.avg}%</span>
        </li>
      ))}
    </ul>
  );
}

type InviteResult = {
  email: string;
  status: string;
  invite_id?: string;
  invite_url?: string;
  message?: string;
};

function extractInviteTokens(input: string): string[] {
  return Array.from(new Set(input.split(/[\s,;]+/u).map((part) => part.trim().toLowerCase()).filter(Boolean)));
}

function BulkInvitePanel({ cohortId, onChanged }: { cohortId: string; onChanged: () => void }) {
  const [inviteText, setInviteText] = useState("");
  const [results, setResults] = useState<InviteResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inviteTokens = useMemo(() => extractInviteTokens(inviteText), [inviteText]);
  const validEmailCount = inviteTokens.filter((part) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(part)).length;

  async function onCsv(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setError("CSV must be smaller than 1 MB.");
      return;
    }
    const text = await file.text();
    setInviteText((current) => `${current}\n${text}`.trim());
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResults([]);
    if (!inviteTokens.length) {
      setError("Add at least one student email address.");
      return;
    }
    setLoading(true);
    const res = await v1.post<{ results: InviteResult[] }>(`cohorts/${cohortId}/invites/bulk`, {
      emails: inviteTokens,
      expires_in_days: 14,
    });
    setLoading(false);
    if (res.ok) {
      setResults(res.data.results ?? []);
      setInviteText("");
      onChanged();
    } else {
      setError(res.message);
    }
  }

  return (
    <form className="w-full max-w-2xl space-y-3" onSubmit={submit}>
      <textarea
        value={inviteText}
        onChange={(e) => setInviteText(e.target.value)}
        placeholder="student@school.edu, another@school.edu"
        rows={3}
        className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-3 py-2 text-[13px] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[var(--rule-strong)] px-4 py-2 text-[12px] font-medium text-[#111111] hover:bg-[var(--field)]">
          Upload CSV
          <input type="file" accept=".csv,text/csv" onChange={onCsv} className="sr-only" />
        </label>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[var(--muted)]">{validEmailCount} valid / {inviteTokens.length} total</span>
          <button type="submit" disabled={loading} className="sim-btn-accent px-4 py-2 font-mono text-[10px] uppercase disabled:opacity-50">
            {loading ? "Sending..." : "Invite students"}
          </button>
        </div>
      </div>
      {error ? <p className="text-[12px] text-red-700">{error}</p> : null}
      {results.length ? (
        <div className="overflow-x-auto rounded-xl border border-[var(--rule)]">
          <table className="w-full min-w-[480px] text-left text-[12px]">
            <tbody>
              {results.map((r) => (
                <tr key={`${r.email}-${r.status}`} className="border-b border-[var(--rule)] last:border-0">
                  <td className="px-3 py-2 font-medium text-[#111111]">{r.email}</td>
                  <td className="px-3 py-2 font-mono uppercase text-[var(--muted)]">{r.status}</td>
                  <td className="px-3 py-2 text-[var(--muted)]">{r.message ?? (r.invite_url ? "Invite link created" : "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </form>
  );
}
