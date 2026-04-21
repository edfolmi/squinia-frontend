import Link from "next/link";
import { notFound } from "next/navigation";

import { getAssignmentById, getScenarioById, RECENT_SESSIONS } from "../../_lib/student-mock-data";
import { bestScoreForScenario, countAttemptsForScenario } from "../../_lib/assignment-attempts";

import { AssignmentDetailForm } from "./assignment-detail-form";
import { AssignmentRulesCallout } from "./assignment-rules-callout";
import { AssignmentSimulationCta } from "./assignment-simulation-cta";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const assignment = getAssignmentById(assignmentId);
  if (!assignment) notFound();
  const scenario = getScenarioById(assignment.scenarioId);
  const attemptsUsed = countAttemptsForScenario(
    RECENT_SESSIONS,
    assignment.scenarioId,
    assignment.kind,
  );
  const bestScore = bestScoreForScenario(RECENT_SESSIONS, assignment.scenarioId, assignment.kind);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/assignments"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Assigned simulations
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">
          {assignment.title}
        </h1>
        <p className="mt-2 text-[14px] text-[var(--muted)]">{assignment.cohort}</p>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--faint)]">
          Due{" "}
          <time dateTime={assignment.dueAt}>
            {new Date(assignment.dueAt).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>{" "}
          · {assignment.points} points
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Simulation</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
          This assignment is completed by running the linked simulation room. Your session is scored in the report
          after you end the simulation; any written follow-up is in addition to that run.
        </p>
        {scenario ? (
          <div className="mt-5 rounded-xl border border-[var(--rule)] bg-[var(--field)]/50 px-4 py-4">
            <p className="text-[13px] font-medium text-[#111111]">{scenario.title}</p>
            <p className="mt-1 text-[13px] text-[var(--muted)]">{scenario.summary}</p>
            <p className="mt-3 text-[12px] leading-snug text-[var(--muted)]">
              Each start creates a new attempt with its own session id and report. Your instructor may cap attempts and
              set a minimum report score.
            </p>
            <div className="mt-4">
              <AssignmentRulesCallout
                assignmentId={assignment.id}
                defaults={{
                  maxAttempts: assignment.maxAttempts,
                  minScorePercent: assignment.minScorePercent,
                }}
                bestScore={bestScore}
              />
            </div>
            <AssignmentSimulationCta
              assignmentId={assignment.id}
              scenarioId={scenario.id}
              kind={scenario.kind}
              attemptsUsed={attemptsUsed}
              defaults={{
                maxAttempts: assignment.maxAttempts,
                minScorePercent: assignment.minScorePercent,
              }}
              buttonClassName="sim-btn-accent mt-4 inline-block px-6 py-3 font-mono text-[10px] uppercase"
            />
          </div>
        ) : (
          <p className="mt-4 text-[14px] text-amber-800">Scenario link missing in preview data.</p>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Instructor brief</h2>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-[var(--muted)]">
          <p>
            Rubric, pacing expectations, and cohort-specific notes will load from your API. For this preview, follow
            the simulation room guidance and treat the report as your primary artifact.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Follow-up</h2>
        <p className="mt-2 text-[13px] text-[var(--muted)]">
          Optional written add-on after your run (reflection, links, or file names when upload is wired).
        </p>
        <div className="mt-4">
          <AssignmentDetailForm assignment={assignment} />
        </div>
      </section>
    </div>
  );
}
