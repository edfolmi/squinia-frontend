"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProductPageHeader, StatusBadge } from "@/app/_components/product-ui";
import { EmptyState, StatusBanner } from "@/app/_components/status-block";
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

type MeData = {
  default_tenant_id: string | null;
  memberships: { tenant_id?: string; account_kind?: string }[];
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
      return "Chat";
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
  const [isIndividual, setIsIndividual] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [res, meRes] = await Promise.all([
      v1.get<ItemsData<ScenarioApi>>("scenarios", { limit: 100, page: 1 }),
      v1.get<MeData>("auth/me"),
    ]);
    if (meRes.ok) {
      const active =
        meRes.data.memberships.find((m) => m.tenant_id === meRes.data.default_tenant_id) ??
        meRes.data.memberships[0];
      setIsIndividual(active?.account_kind === "individual");
    } else {
      setIsIndividual(false);
    }
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
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeout);
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
      <ProductPageHeader
        eyebrow="Practice library"
        title="Scenarios"
        description="Choose a realistic practice room, meet the persona before you begin, and start a fresh attempt when you are ready."
        action={
          isIndividual ? (
            <Link href="/scenarios/new" className="sim-btn-accent shrink-0 px-5 py-3 text-center font-mono text-[10px] uppercase">
              Create practice with AI
            </Link>
          ) : null
        }
      />

      {error ? (
        <StatusBanner message={error} />
      ) : null}

      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="filter-role" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Role
          </label>
          <select
            id="filter-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="squinia-input px-3 py-2.5 text-[14px]"
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
            className="squinia-input px-3 py-2.5 text-[14px]"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[13px] text-[var(--muted)] sm:ml-auto sm:pb-2">
          {loading ? "Loading..." : `${filtered.length} scenario${filtered.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {filtered.map((s) => {
          const isExpanded = Boolean(expanded[s.id]);
          const summaryLong = s.summary.length > 190;
          return (
            <li
              key={s.id}
              className="sim-transition flex flex-col rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:border-[var(--rule-strong)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge>{kindLabel(s.kind)}</StatusBadge>
                <StatusBadge tone="success">{s.difficulty}</StatusBadge>
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
        <EmptyState
          title="No scenarios match these filters"
          message={isIndividual ? "Try a different filter or create a personal practice scenario with AI." : "Try a different role or difficulty level, or ask your organisation to publish more practice scenarios."}
        />
      ) : null}
    </div>
  );
}
