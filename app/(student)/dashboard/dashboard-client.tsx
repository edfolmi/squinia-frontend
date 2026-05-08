"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { SquiniaBrandLockup } from "@/app/_components/squinia-brand";
import { EmptyState, StatusBanner } from "@/app/_components/status-block";
import { v1, type ItemsData } from "@/app/_lib/v1-client";
import { sessionModeToUiKind, simulationReportHref } from "@/app/_lib/simulation-mappers";

type MeData = {
  user: { id: string; full_name?: string; email?: string };
  default_tenant_id: string | null;
  memberships: unknown[];
};

type AssignmentItem = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  type: string;
  content?: Record<string, unknown>;
  session_id?: string | null;
};

type LearnerCohort = {
  id: string;
  name: string;
  description?: string | null;
  status?: string;
  joined_at?: string;
};

type SessionItem = {
  id: string;
  mode?: string;
  status: string;
  scenario_snapshot?: Record<string, unknown>;
  ended_at?: string | null;
  cohort_id?: string | null;
  updated_at?: string;
};

type UserSummary = {
  total_sessions: number;
  completed_sessions?: number;
  completion_rate?: number;
  avg_score: number | null;
  trend: string;
  weakest_criteria: string[];
  strongest_criteria: string[];
  cohort_id?: string | null;
  cohort_name?: string | null;
};

function snapshotTitle(snap: unknown): string {
  if (snap && typeof snap === "object" && snap !== null && "title" in snap) {
    const t = (snap as { title?: unknown }).title;
    if (typeof t === "string" && t.length) return t;
  }
  return "Simulation";
}

function assignmentCohortId(assignment: AssignmentItem): string | null {
  const content = assignment.content ?? {};
  for (const key of ["cohort_id", "cohortId"]) {
    const value = content[key];
    if (typeof value === "string" && value) return value;
  }
  return null;
}

export function DashboardClient() {
  const searchParams = useSearchParams();
  const cohortParam = searchParams.get("cohort");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeData | null>(null);
  const [cohorts, setCohorts] = useState<LearnerCohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(cohortParam);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const meRes = await v1.get<MeData>("auth/me");
    if (!meRes.ok) {
      setError(meRes.message);
      setLoading(false);
      return;
    }
    setMe(meRes.data);
    const userId = meRes.data.user.id;
    const cohortRes = await v1.get<{ cohorts: LearnerCohort[] }>("me/cohorts");
    const learnerCohorts = cohortRes.ok ? cohortRes.data.cohorts ?? [] : [];
    setCohorts(learnerCohorts);
    const cohortId =
      learnerCohorts.find((cohort) => cohort.id === cohortParam)?.id ??
      learnerCohorts[0]?.id ??
      null;
    setSelectedCohortId(cohortId);
    if (cohortId) {
      window.localStorage.setItem("squinia:selectedCohortId", cohortId);
    } else {
      window.localStorage.removeItem("squinia:selectedCohortId");
    }

    const [asgRes, sessRes, sumRes] = await Promise.all([
      v1.get<ItemsData<AssignmentItem>>("assignments", { assigned_to_me: true, limit: 20, page: 1 }),
      v1.get<ItemsData<SessionItem>>("sessions", { limit: 15, page: 1, ...(cohortId ? { cohort_id: cohortId } : {}) }),
      cohortId
        ? v1.get<{ summary: UserSummary }>(`analytics/me/cohorts/${cohortId}/summary`)
        : v1.get<{ summary: UserSummary }>(`analytics/users/${userId}/summary`),
    ]);

    if (asgRes.ok) {
      const items = asgRes.data.items ?? [];
      setAssignments(cohortId ? items.filter((item) => assignmentCohortId(item) === cohortId || assignmentCohortId(item) === null) : items);
    }
    else setAssignments([]);

    if (sessRes.ok) {
      const items = sessRes.data.items ?? [];
      const completed = items.filter((s) => s.status === "COMPLETED" || s.ended_at);
      setSessions(completed.length ? completed : items);
    } else setSessions([]);

    if (sumRes.ok) setSummary(sumRes.data.summary);
    else setSummary(null);

    setLoading(false);
  }, [cohortParam]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const latestScore = summary?.avg_score != null ? Math.round(summary.avg_score) : null;
  const progressBars =
    summary && (summary.strongest_criteria.length > 0 || summary.weakest_criteria.length > 0)
      ? [
          { label: "Strong", value: summary.strongest_criteria.length * 20 },
          { label: "Focus", value: summary.weakest_criteria.length * 15 },
          { label: "Avg", value: latestScore ?? 50 },
        ]
      : [
          { label: "Sessions", value: Math.min(100, (summary?.total_sessions ?? 0) * 10) },
          { label: "Avg", value: latestScore ?? 40 },
          { label: "Trend", value: summary?.trend === "up" ? 75 : summary?.trend === "down" ? 45 : 60 },
        ];

  const maxProgress = Math.max(...progressBars.map((p) => p.value), 1);
  const selectedCohort = cohorts.find((cohort) => cohort.id === selectedCohortId) ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {error ? (
        <StatusBanner message={error} action={{ href: "/login", label: "Sign in" }} />
      ) : null}

      <section className="overflow-hidden rounded-lg border border-[var(--rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f5f8f2_54%,#e9f4e8_100%)] shadow-[0_22px_70px_-48px_rgba(11,32,20,0.42)]">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-9">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b8dec2] bg-white/72 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f6f34]">
              Live training workspace
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-semibold text-[#0b2014] sm:text-4xl">
              Turn pressure into reps before the real conversation.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--muted)]">
              {me?.user?.full_name ? (
                <>
                  Welcome back, <span className="font-semibold text-[#111111]">{me.user.full_name}</span>. Pick up
                  assigned simulations, review your latest evidence, and keep sharpening the moments that matter.
                </>
              ) : (
                <>Pick up assigned simulations, review recent scores, and keep building confident execution.</>
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/assignments" className="sim-btn-accent px-5 py-2.5 font-mono text-[10px] uppercase">
                Open assignments
              </Link>
              <Link
                href="/scenarios"
                className="rounded-lg border border-[var(--rule-strong)] bg-white/78 px-5 py-2.5 text-[13px] font-semibold text-[#111111] transition-colors hover:bg-white"
              >
                Browse scenarios
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-white/80 bg-white/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <SquiniaBrandLockup href="/dashboard" compact className="inline-flex" />
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div>
                <p className="text-2xl font-semibold text-[#0b2014]">
                  {loading ? "--" : assignments.length}
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--faint)]">Assigned</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#0b2014]">
                  {loading ? "--" : sessions.length}
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--faint)]">Sessions</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#0b2014]">
                  {latestScore == null ? "--" : latestScore}
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--faint)]">Avg</p>
              </div>
            </div>
            <p className="mt-6 text-[12px] leading-6 text-[var(--muted)]">
              Every session becomes a feedback loop: transcript, score, coaching note, and next rep.
            </p>
          </div>
        </div>
      </section>

      {cohorts.length > 0 ? (
        <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_6px_36px_-18px_rgba(17,17,17,0.08)] sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--faint)]">Cohort context</p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
                {selectedCohort ? selectedCohort.name : "Your cohorts"}
              </h2>
            </div>
            {cohorts.length > 1 ? (
              <p className="text-[13px] text-[var(--muted)]">Switch cohorts to keep analytics and history separate.</p>
            ) : null}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cohorts.map((cohort) => {
              const active = cohort.id === selectedCohortId;
              return (
                <Link
                  key={cohort.id}
                  href={`/dashboard?cohort=${encodeURIComponent(cohort.id)}`}
                  className={`rounded-xl border px-4 py-4 transition-colors ${
                    active
                      ? "border-[#32a852] bg-[#f2fbf4] text-[#0b2014]"
                      : "border-[var(--rule)] bg-[var(--field)]/35 text-[#111111] hover:bg-[var(--field)]"
                  }`}
                >
                  <p className="font-semibold">{cohort.name}</p>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[var(--muted)]">
                    {cohort.description || "Cohort-specific simulations, assignments, and performance."}
                  </p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                    {active ? "Selected" : "View cohort"}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}


      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_6px_36px_-18px_rgba(17,17,17,0.08)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--faint)]">Assigned to you</p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">Assignments</h2>
          </div>
          <Link
            href="/assignments"
            className="text-[13px] font-medium text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
          >
            View all
          </Link>
        </div>
        {loading ? (
          <p className="mt-6 text-[14px] text-[var(--muted)]">Loading...</p>
        ) : assignments.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No assignments yet"
              message="When your organisation assigns a simulation, it will appear here with its due date and practice mode."
              action={{ href: "/scenarios", label: "Browse scenarios" }}
            />
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {assignments.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-3 rounded-xl border border-[var(--rule)] bg-[var(--field)]/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#111111]">{a.title}</p>
                  <p className="mt-1 text-[13px] text-[var(--muted)]">
                    {a.type.replace(/_/g, " ").toLowerCase()} - {a.status.toLowerCase().replace(/_/g, " ")}
                    {a.due_at ? (
                      <>
                        {" "}
                        - Due{" "}
                        <time dateTime={a.due_at}>
                          {new Date(a.due_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </time>
                      </>
                    ) : null}
                  </p>
                </div>
                <Link
                  href={`/assignments/${a.id}`}
                  className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-center text-[12px] text-[var(--faint)]">
          <Link href="/scenarios" className="font-medium text-[#111111] underline underline-offset-2">
            Browse scenarios
          </Link>
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_6px_36px_-18px_rgba(17,17,17,0.08)] sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--faint)]">Recent sessions</p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">History</h2>
          {loading ? (
            <p className="mt-5 text-[14px] text-[var(--muted)]">Loading...</p>
          ) : sessions.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No sessions yet"
                message="Start a simulation to create your first transcript, recording, and evaluation report."
                action={{ href: "/scenarios", label: "Start practice" }}
              />
            </div>
          ) : (
            <ul className="mt-5 space-y-0 divide-y divide-[var(--rule)]">
              {sessions.slice(0, 8).map((row) => {
                const kind = sessionModeToUiKind(row.mode);
                const ended = row.ended_at ?? row.updated_at ?? "";
                return (
                  <li key={row.id} className="flex items-center justify-between gap-3 py-4 first:pt-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#111111]">{snapshotTitle(row.scenario_snapshot)}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                        {kind} - {row.status.toLowerCase()}
                        {ended ? (
                          <>
                            {" - "}
                            {new Date(ended).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </>
                        ) : null}
                      </p>
                    </div>
                    <Link
                      href={simulationReportHref(row.id, kind)}
                      className="shrink-0 rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
                    >
                      Report
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/sessions"
            className="mt-4 inline-block text-[13px] font-medium text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
          >
            View all sessions
          </Link>
        </section>

        <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_6px_36px_-18px_rgba(17,17,17,0.08)] sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--faint)]">Progress</p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">Activity</h2>
          <p className="mt-2 text-[13px] text-[var(--muted)]">
            {summary ? (
              <>
                <strong className="text-[#111111]">{summary.total_sessions}</strong> sessions
                {summary.avg_score != null ? (
                  <>
                    {" "}
                    - avg score <strong className="text-[#111111]">{Math.round(summary.avg_score)}</strong>
                  </>
                ) : null}{" "}
                - trend <strong className="text-[#111111]">{summary.trend}</strong>
              </>
            ) : (
              "Sign in and complete sessions to see analytics."
            )}
          </p>
          <div className="mt-8 flex h-40 items-end justify-between gap-1 sm:gap-2" role="img" aria-label="Activity chart">
            {progressBars.map((p) => (
              <div key={p.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div
                  className="w-full max-w-[2.75rem] rounded-t-lg bg-[#32a852]/85"
                  style={{ height: `${Math.max(10, Math.round((p.value / maxProgress) * 120))}px` }}
                  title={`${p.label}: ${p.value}`}
                />
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--faint)]">{p.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">Practice</p>
            <p className="mt-1 text-[14px] text-[var(--muted)]">Run any published scenario in your tenant.</p>
          </div>
          <Link href="/scenarios" className="sim-btn-accent px-5 py-2.5 font-mono text-[10px] uppercase">
            Browse scenarios
          </Link>
        </div>
      </section>
    </div>
  );
}
