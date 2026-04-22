"use client";

import { useMemo, useState } from "react";

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

type Props = {
  cohortId: string;
  members: CohortMemberVm[];
  progress: ProgressRowVm[];
  skillAverage: OrgSkillProfile | null;
};

export function CohortDetailTabs({ cohortId, members, progress, skillAverage }: Props) {
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Member list</h2>
            <InviteRow />
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
                <span
                  className={`rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] ${
                    m.status === "active" ? "bg-[#e6f4ea] text-[#166534]" : "bg-amber-50 text-[#a16207]"
                  }`}
                >
                  {m.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "Progress" ? (
        <section className="overflow-hidden rounded-2xl border border-[var(--rule)] bg-[var(--surface)]">
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
                        {p.bestScore != null ? `${p.bestScore}%` : "—"}
                      </td>
                      <td className="px-4 py-3">{p.completed ? "Yes" : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
              <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">Per student</h3>
              <ul className="space-y-3">
                {progressRows.map(({ member, rows }) => {
                  return (
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
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function InviteRow() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={async (e) => {
        e.preventDefault();
        setMsg(null);
        setLoading(true);
        const res = await v1.post("auth/invites", {
          email: email.trim(),
          role: "STUDENT",
          expires_in_days: 14,
        });
        setLoading(false);
        if (res.ok) {
          setMsg("Invite created.");
          setEmail("");
        } else {
          setMsg(res.message);
        }
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="learner@company.com"
        className="min-w-0 flex-1 rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-3 py-2 text-[13px] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl border border-[var(--rule-strong)] px-4 py-2 text-[12px] font-medium text-[#111111] hover:bg-[var(--field)] disabled:opacity-50"
      >
        {loading ? "Sending…" : "Invite"}
      </button>
      {msg ? <p className="mt-2 w-full text-[12px] text-[var(--muted)]">{msg}</p> : null}
    </form>
  );
}
