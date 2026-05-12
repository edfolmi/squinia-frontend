"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { agentRoleLabel, scenarioDifficultyLabel, scenarioConfigToUiKind, sessionModeToUiKind } from "@/app/_lib/simulation-mappers";
import { v1, type ItemsData } from "@/app/_lib/v1-client";

import { bestScoreForScenario, countAttemptsForScenario } from "../../_lib/assignment-attempts";
import type { AssignmentRow, PublishedScenario, RecentSessionRow, SimulationKind } from "../../_lib/student-mock-data";

import { AssignmentDetailForm } from "./assignment-detail-form";
import { AssignmentRulesCallout } from "./assignment-rules-callout";
import { AssignmentSimulationCta } from "./assignment-simulation-cta";

type AssignmentApi = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  type: string;
  content?: Record<string, unknown>;
  session_id?: string | null;
};

type SessionItem = {
  id: string;
  mode?: string;
  scenario_id: string;
  scenario_snapshot?: Record<string, unknown>;
  ended_at?: string | null;
  updated_at?: string;
};

function mapAssignmentStatus(s: string): AssignmentRow["status"] {
  const x = s.toUpperCase();
  if (x === "SUBMITTED") return "submitted";
  if (x === "GRADED") return "graded";
  return "pending";
}

function contentNum(c: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!c) return fallback;
  const v = c[key];
  return typeof v === "number" ? v : fallback;
}

function contentStr(c: Record<string, unknown> | undefined, key: string, fallback: string): string {
  if (!c) return fallback;
  const v = c[key];
  return typeof v === "string" && v.length ? v : fallback;
}

function inferKindFromContent(content: Record<string, unknown> | undefined): SimulationKind {
  const m = content?.modality;
  if (m === "VOICE" || m === "phone") return "phone";
  if (m === "VIDEO" || m === "video") return "video";
  return "chat";
}

function snapshotTitle(snap: unknown): string {
  if (snap && typeof snap === "object" && snap !== null && "title" in snap) {
    const t = (snap as { title?: unknown }).title;
    if (typeof t === "string" && t.length) return t;
  }
  return "Simulation";
}

async function resolveScenarioId(assignment: AssignmentApi): Promise<string | null> {
  const c = assignment.content ?? {};
  const fromContent = c.scenario_id;
  if (typeof fromContent === "string" && fromContent.length) return fromContent;
  if (assignment.session_id) {
    const res = await v1.get<{ session: SessionItem }>(`sessions/${assignment.session_id}`);
    if (res.ok && res.data.session?.scenario_id) return res.data.session.scenario_id;
  }
  return null;
}

export function AssignmentDetailClient() {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = params.assignmentId;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignmentApi | null>(null);
  const [scenario, setScenario] = useState<PublishedScenario | null>(null);
  const [sessionRows, setSessionRows] = useState<RecentSessionRow[]>([]);

  const load = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);

    const det = await v1.get<{ assignment: AssignmentApi; submission: unknown }>(`assignments/${assignmentId}`);
    if (!det.ok) {
      setError(det.message);
      setAssignment(null);
      setLoading(false);
      return;
    }
    const a = det.data.assignment;
    setAssignment(a);

    const scenarioId = await resolveScenarioId(a);
    if (scenarioId) {
      const sc = await v1.get<{ scenario: Record<string, unknown> }>(`scenarios/${scenarioId}`);
      if (sc.ok) {
        const s = sc.data.scenario;
        const cfg = typeof s.config === "object" && s.config !== null ? s.config : undefined;
        setScenario({
          id: String(s.id),
          title: String(s.title ?? "Scenario"),
          summary: typeof s.description === "string" ? s.description : "",
          role: agentRoleLabel(typeof s.agent_role === "string" ? s.agent_role : ""),
          difficulty: scenarioDifficultyLabel(typeof s.difficulty === "string" ? s.difficulty : "") as PublishedScenario["difficulty"],
          kind: scenarioConfigToUiKind(cfg) as SimulationKind,
          estMinutes: typeof s.estimated_minutes === "number" ? s.estimated_minutes : 30,
        });
      } else {
        setScenario(null);
      }
    } else {
      setScenario(null);
    }

    const sess = await v1.get<ItemsData<SessionItem>>("sessions", { limit: 100, page: 1 });
    if (sess.ok && scenarioId) {
      const mapped: RecentSessionRow[] = (sess.data.items ?? [])
        .filter((s) => s.scenario_id === scenarioId)
        .map((s) => ({
          sessionId: s.id,
          kind: sessionModeToUiKind(s.mode),
          scenarioTitle: snapshotTitle(s.scenario_snapshot),
          score: null,
          endedAt: s.ended_at ?? s.updated_at ?? new Date().toISOString(),
          apiScenarioId: s.scenario_id,
        }));
      setSessionRows(mapped);
    } else {
      setSessionRows([]);
    }

    setLoading(false);
  }, [assignmentId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  if (!assignmentId) {
    return <p className="text-[14px] text-[var(--muted)]">Missing assignment id.</p>;
  }

  if (loading) {
    return <p className="mx-auto max-w-2xl text-[14px] text-[var(--muted)]">Loading assignment…</p>;
  }

  if (!assignment) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-[14px] text-amber-900">{error ?? "Assignment not found."}</p>
        <Link href="/assignments" className="font-medium text-[#111111] underline">
          Back to assignments
        </Link>
      </div>
    );
  }

  const row: AssignmentRow = {
    id: assignment.id,
    title: assignment.title,
    cohort: contentStr(assignment.content, "cohort_name", "Assigned work"),
    scenarioId: scenario?.id ?? "unknown",
    kind: scenario?.kind ?? inferKindFromContent(assignment.content),
    dueAt: assignment.due_at ?? new Date().toISOString(),
    status: mapAssignmentStatus(assignment.status),
    points: contentNum(assignment.content, "points", 10),
    maxAttempts: contentNum(assignment.content, "max_attempts", 5),
    minScorePercent: contentNum(assignment.content, "min_score_percent", 70),
  };

  const attemptsUsed = scenario
    ? countAttemptsForScenario(sessionRows, scenario.id, scenario.kind)
    : 0;
  const bestScore = scenario ? bestScoreForScenario(sessionRows, scenario.id, scenario.kind) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/assignments"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Assigned simulations
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">{assignment.title}</h1>
        <p className="mt-2 text-[14px] text-[var(--muted)]">{row.cohort}</p>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--faint)]">
          Due{" "}
          <time dateTime={row.dueAt}>
            {new Date(row.dueAt).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>{" "}
          · {row.points} points
        </p>
      </div>

      {error && assignment ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">{error}</p>
      ) : null}

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Simulation</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
          Complete this assignment by running the linked simulation. Your session is scored in the report after you end
          the run.
        </p>
        {scenario ? (
          <div className="mt-5 rounded-xl border border-[var(--rule)] bg-[var(--field)]/50 px-4 py-4">
            <p className="text-[13px] font-medium text-[#111111]">{scenario.title}</p>
            <p className="mt-1 text-[13px] text-[var(--muted)]">{scenario.summary}</p>
            <div className="mt-4">
              <AssignmentRulesCallout
                assignmentId={assignment.id}
                defaults={{
                  maxAttempts: row.maxAttempts,
                  minScorePercent: row.minScorePercent,
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
                maxAttempts: row.maxAttempts,
                minScorePercent: row.minScorePercent,
              }}
              buttonClassName="sim-btn-accent mt-4 inline-block px-6 py-3 font-mono text-[10px] uppercase"
            />
          </div>
        ) : (
          <p className="mt-4 text-[14px] text-amber-800">
            Could not resolve a linked scenario for this assignment. Check ``session_id`` or ``content.scenario_id`` on
            the API payload.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Instructor brief</h2>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-[var(--muted)]">
          <p>Instructions and rubric context load from your instructor when provided on the assignment record.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Follow-up</h2>
        <p className="mt-2 text-[13px] text-[var(--muted)]">Optional written add-on after your run.</p>
        <div className="mt-4">
          <AssignmentDetailForm assignment={row} />
        </div>
      </section>
    </div>
  );
}
