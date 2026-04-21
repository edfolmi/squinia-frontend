import Link from "next/link";

import { StartSimulationButton } from "../../simulation/_components/start-simulation-button";

import {
  ASSIGNED,
  BADGES,
  getScenarioById,
  PROGRESS_SERIES,
  RECENT_SESSIONS,
  reportHref,
} from "../_lib/student-mock-data";

export default function DashboardPage() {
  const maxProgress = Math.max(...PROGRESS_SERIES.map((p) => p.value), 1);
  const latestScore = PROGRESS_SERIES[PROGRESS_SERIES.length - 1]?.value ?? 0;
  const avgScore = Math.round(
    PROGRESS_SERIES.reduce((a, p) => a + p.value, 0) / PROGRESS_SERIES.length,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
          Pick up assigned simulations, review recent scores, and keep your streak going. Every time you start a
          scenario you get a new attempt — each has its own report.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_6px_36px_-18px_rgba(17,17,17,0.08)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--faint)]">
              Assigned to you
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">Simulations</h2>
          </div>
          <Link
            href="/scenarios"
            className="text-[13px] font-medium text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
          >
            Browse all scenarios
          </Link>
        </div>
        <ul className="mt-6 space-y-3">
          {ASSIGNED.map((a) => {
            const s = getScenarioById(a.scenarioId);
            if (!s) return null;
            return (
              <li
                key={a.scenarioId}
                className="flex flex-col gap-3 rounded-xl border border-[var(--rule)] bg-[var(--field)]/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[#111111]">{s.title}</p>
                    {a.priority === "high" ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[#a16207]">
                        Priority
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[13px] text-[var(--muted)]">
                    {s.role} · {s.difficulty}
                    {a.dueAt ? (
                      <>
                        {" "}
                        · Due{" "}
                        <time dateTime={a.dueAt}>
                          {new Date(a.dueAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </>
                    ) : null}
                  </p>
                </div>
                <StartSimulationButton
                  scenarioId={s.id}
                  kind={s.kind}
                  className="sim-btn-accent shrink-0 self-start px-5 py-2.5 text-center font-mono text-[10px] uppercase sm:self-auto"
                >
                  New attempt
                </StartSimulationButton>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_6px_36px_-18px_rgba(17,17,17,0.08)] sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--faint)]">Recent sessions</p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">History</h2>
          <ul className="mt-5 space-y-0 divide-y divide-[var(--rule)]">
            {RECENT_SESSIONS.map((row) => (
              <li key={row.sessionId} className="flex items-center justify-between gap-3 py-4 first:pt-0">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#111111]">{row.scenarioTitle}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                    {row.kind} ·{" "}
                    {new Date(row.endedAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-[13px] font-medium tabular-nums text-[#166534]">
                    {row.score}
                  </span>
                  <Link
                    href={reportHref(row.sessionId, row.kind)}
                    className="rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
                  >
                    Report
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/sessions"
            className="mt-4 inline-block text-[13px] font-medium text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
          >
            View all sessions
          </Link>
        </section>

        <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_6px_36px_-18px_rgba(17,17,17,0.08)] sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--faint)]">Progress</p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">Scores over time</h2>
          <p className="mt-2 text-[13px] text-[var(--muted)]">
            Rolling weekly average · last data point <strong className="text-[#111111]">{latestScore}</strong>{" "}
            · overall avg <strong className="text-[#111111]">{avgScore}</strong>
          </p>
          <div className="mt-8 flex h-40 items-end justify-between gap-1 sm:gap-2" role="img" aria-label="Score trend chart">
            {PROGRESS_SERIES.map((p) => (
              <div key={p.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div
                  className="w-full max-w-[2.75rem] rounded-t-lg bg-[#32a852]/85"
                  style={{ height: `${Math.max(10, Math.round((p.value / maxProgress) * 120))}px` }}
                  title={`${p.label}: ${p.value}`}
                />
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--faint)]">
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_6px_36px_-18px_rgba(17,17,17,0.08)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--faint)]">Streak & badges</p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">Completion</h2>
          </div>
          <p className="rounded-full bg-[#e6f4ea] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#166534]">
            3-day streak
          </p>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((b) => (
            <li
              key={b.id}
              className={`rounded-xl border px-4 py-4 ${
                b.earned
                  ? "border-[#166534]/25 bg-[#e6f4ea]/50"
                  : "border-dashed border-[var(--rule)] bg-[var(--field)]/40 opacity-80"
              }`}
            >
              <p className="font-medium text-[#111111]">{b.label}</p>
              <p className="mt-2 text-[12px] leading-snug text-[var(--muted)]">{b.description}</p>
              <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--faint)]">
                {b.earned ? "Earned" : "Locked"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">Assigned</p>
            <p className="mt-1 text-[14px] text-[var(--muted)]">Simulations due from your instructor</p>
          </div>
          <Link href="/assignments" className="sim-btn-accent px-5 py-2.5 font-mono text-[10px] uppercase">
            View assigned
          </Link>
        </div>
      </section>
    </div>
  );
}
