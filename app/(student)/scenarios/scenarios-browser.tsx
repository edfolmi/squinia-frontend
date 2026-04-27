"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { agentRoleLabel, scenarioDifficultyLabel, scenarioConfigToUiKind } from "@/app/_lib/simulation-mappers";
import { v1, type ItemsData } from "@/app/_lib/v1-client";

import { StartSimulationButton } from "../../simulation/_components/start-simulation-button";
import { PersonaAvatar, personaFromScenarioLike, type RuntimePersona } from "../../simulation/_lib/persona-runtime";

import type { Difficulty, PublishedScenario, SimulationKind } from "../_lib/student-mock-data";

type ScenarioApi = {
  id: string;
  title: string;
  description?: string | null;
  agent_role?: string;
  difficulty?: string;
  estimated_minutes?: number;
  status?: string;
  config?: Record<string, unknown> | null;
  persona?: Record<string, unknown> | null;
};

type ScenarioCard = PublishedScenario & {
  persona: RuntimePersona;
};

function toPublished(s: ScenarioApi): ScenarioCard {
  const diff = scenarioDifficultyLabel(s.difficulty) as Difficulty;
  return {
    id: s.id,
    title: s.title,
    summary: typeof s.description === "string" ? s.description : "",
    role: agentRoleLabel(s.agent_role),
    difficulty: diff,
    kind: scenarioConfigToUiKind(s.config) as SimulationKind,
    estMinutes: typeof s.estimated_minutes === "number" ? s.estimated_minutes : 30,
    persona: personaFromScenarioLike(s),
  };
}

function kindLabel(kind: PublishedScenario["kind"]) {
  switch (kind) {
    case "chat":
      return "Transcript";
    case "phone":
      return "Phone";
    case "video":
      return "Video";
    default:
      return kind;
  }
}

export function ScenariosBrowser() {
  const [scenarios, setScenarios] = useState<ScenarioCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("All roles");
  const [difficulty, setDifficulty] = useState<"All levels" | Difficulty>("All levels");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await v1.get<ItemsData<ScenarioApi>>("scenarios", { limit: 100, page: 1 });
    if (!res.ok) {
      setError(res.message);
      setScenarios([]);
      setLoading(false);
      return;
    }
    setScenarios((res.data.items ?? []).map(toPublished));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ROLES = useMemo(
    () => ["All roles", ...Array.from(new Set(scenarios.map((s) => s.role)))],
    [scenarios],
  );
  const DIFFICULTIES: ("All levels" | Difficulty)[] = ["All levels", "Beginner", "Medium", "Advanced"];

  const filtered = useMemo(() => {
    return scenarios.filter((s) => {
      if (role !== "All roles" && s.role !== role) return false;
      if (difficulty !== "All levels" && s.difficulty !== difficulty) return false;
      return true;
    });
  }, [scenarios, role, difficulty]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Scenarios</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
          Published practice rooms in your organization. Each start opens a new attempt with a server-backed session id.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}

      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="filter-role" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Role
          </label>
          <select
            id="filter-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="sim-transition w-full cursor-pointer rounded-xl border border-[var(--rule-strong)] bg-[var(--field)] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[12rem] flex-1">
          <label
            htmlFor="filter-difficulty"
            className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]"
          >
            Difficulty
          </label>
          <select
            id="filter-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as (typeof DIFFICULTIES)[number])}
            className="sim-transition w-full cursor-pointer rounded-xl border border-[var(--rule-strong)] bg-[var(--field)] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[13px] text-[var(--muted)] sm:ml-auto sm:pb-2">
          {loading ? "Loading…" : `${filtered.length} scenario${filtered.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {filtered.map((s) => {
          const isExpanded = Boolean(expanded[s.id]);
          const summaryLong = s.summary.length > 190;
          return (
            <li
              key={s.id}
              className="flex flex-col rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[0_6px_36px_-18px_rgba(17,17,17,0.08)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--rule)] bg-[var(--field)] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  {kindLabel(s.kind)}
                </span>
                <span className="rounded-full bg-[#e6f4ea]/90 px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#166534]">
                  {s.difficulty}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-[#111111]">{s.title}</h2>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--rule)] bg-[var(--field)]/55 px-3 py-3">
                <PersonaAvatar
                  persona={s.persona}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--rule)] bg-[var(--surface)] text-[13px] font-semibold text-[#111111]"
                />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-[#111111]">{s.persona.name}</p>
                  <p className="truncate text-[13px] text-[var(--muted)]">{s.persona.title}</p>
                </div>
              </div>
              <div className="mt-3 flex-1">
                <p
                  className={`text-[14px] leading-relaxed text-[var(--muted)] ${
                    !isExpanded && summaryLong ? "max-h-[4.75rem] overflow-hidden" : ""
                  }`}
                >
                  {s.summary}
                </p>
                {summaryLong ? (
                  <button
                    type="button"
                    onClick={() => setExpanded((current) => ({ ...current, [s.id]: !isExpanded }))}
                    className="mt-2 text-[12px] font-medium text-[#166534] underline-offset-4 hover:underline"
                  >
                    {isExpanded ? "Show less" : "Read full summary"}
                  </button>
                ) : null}
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">{s.role}</p>
              <p className="mt-1 text-[12px] text-[var(--muted)]">~{s.estMinutes} min</p>
              <StartSimulationButton
                scenarioId={s.id}
                kind={s.kind}
                className="sim-btn-accent mt-6 w-full py-3 text-center font-mono text-[10px] uppercase"
              >
                Start new attempt
              </StartSimulationButton>
            </li>
          );
        })}
      </ul>

      {!loading && filtered.length === 0 ? (
        <p className="text-center text-[14px] text-[var(--muted)]">No scenarios match these filters.</p>
      ) : null}
    </div>
  );
}
