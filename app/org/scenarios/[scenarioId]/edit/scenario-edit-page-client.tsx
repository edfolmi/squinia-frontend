"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { scenarioConfigToUiKind, type UiSimulationKind } from "@/app/_lib/simulation-mappers";
import { v1 } from "@/app/_lib/v1-client";

import type { PersonaGender } from "../../../_lib/agent-personas";
import { ScenarioEditorForm } from "../../../_components/scenario-editor-form";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type AgentRole = "TECHNICAL_INTERVIEWER" | "HR_RECRUITER" | "PRODUCT_MANAGER" | "PEER_DEVELOPER" | "CLIENT_STAKEHOLDER";

type RubricApi = {
  id: string;
  criterion?: string;
  description?: string | null;
  weight?: number;
  sort_order?: number;
};

type ScenarioInput = {
  id: string;
  title: string;
  summary: string;
  role: string;
  difficulty: Difficulty;
  agentRole: AgentRole;
  personaId: string;
  simulationKind: UiSimulationKind;
  estMinutes: number;
  personaName: string;
  personaTitle: string;
  personaGender: PersonaGender;
  personaAvatarUrl: string;
  personaVoiceId: string;
  personaPersonality: string;
  personaCommunicationStyle: string;
  personaBackground: string;
  openingMessage: string;
  successCriteria: string;
  feedbackGuidance: string;
  configNotes: string;
  rubricBoardId: string;
  rubricSourceName: string;
  rubric: { id: string; label: string; description: string; weight: number; order: number }[];
  published: boolean;
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function personaGender(value: unknown): PersonaGender {
  const raw = String(value ?? "UNSPECIFIED").toUpperCase();
  return (["FEMALE", "MALE", "NON_BINARY", "UNSPECIFIED"].includes(raw) ? raw : "UNSPECIFIED") as PersonaGender;
}

function mapScenario(payload: {
  scenario: Record<string, unknown> & { rubric_items?: RubricApi[] };
}): ScenarioInput {
  const s = payload.scenario;
  const rubricItems = Array.isArray(s.rubric_items) ? s.rubric_items : [];
  const rubric = rubricItems.map((r, i) => ({
    id: String(r.id),
    label: String(r.criterion ?? "Criterion"),
    description: typeof r.description === "string" ? r.description : "",
    weight: typeof r.weight === "number" ? r.weight : 1,
    order: typeof r.sort_order === "number" ? r.sort_order : i,
  }));

  const rawDiff = String(s.difficulty ?? "INTERMEDIATE").toUpperCase();
  const diff = (["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(rawDiff) ? rawDiff : "INTERMEDIATE") as Difficulty;

  const rawRole = String(s.agent_role ?? "TECHNICAL_INTERVIEWER").toUpperCase();
  const validRoles: AgentRole[] = ["TECHNICAL_INTERVIEWER", "HR_RECRUITER", "PRODUCT_MANAGER", "PEER_DEVELOPER", "CLIENT_STAKEHOLDER"];
  const agentRole = (validRoles.includes(rawRole as AgentRole) ? rawRole : "TECHNICAL_INTERVIEWER") as AgentRole;

  const config = typeof s.config === "object" && s.config !== null ? (s.config as Record<string, unknown>) : {};
  const customPersona = typeof config.persona === "object" && config.persona !== null ? (config.persona as Record<string, unknown>) : {};
  const rubricSource = typeof config.rubric_source === "object" && config.rubric_source !== null ? (config.rubric_source as Record<string, unknown>) : {};

  return {
    id: String(s.id),
    title: String(s.title ?? ""),
    summary: typeof s.description === "string" ? s.description : "",
    role: typeof config.learner_role === "string" ? config.learner_role : "",
    difficulty: diff,
    agentRole,
    personaId: typeof s.persona_id === "string" ? s.persona_id : "",
    simulationKind: scenarioConfigToUiKind(config),
    estMinutes: typeof s.estimated_minutes === "number" ? s.estimated_minutes : 30,
    personaName: text(customPersona.name) || text(config.persona_name),
    personaTitle:
      text(customPersona.title) ||
      text(config.persona_title) ||
      text(config.persona_role),
    personaGender: personaGender(customPersona.gender || config.persona_gender),
    personaAvatarUrl: text(customPersona.avatar_url) || text(config.persona_avatar_url),
    personaVoiceId: text(customPersona.voice_id) || text(config.persona_voice_id),
    personaPersonality: text(customPersona.personality) || text(config.persona_personality),
    personaCommunicationStyle: text(customPersona.communication_style) || text(config.persona_communication_style),
    personaBackground: text(customPersona.background) || text(config.persona_background),
    openingMessage: typeof config.opening_message === "string" ? config.opening_message : "",
    successCriteria: typeof config.success_criteria === "string" ? config.success_criteria : "",
    feedbackGuidance: typeof config.feedback_guidance === "string" ? config.feedback_guidance : "",
    configNotes: typeof config.config_notes === "string" ? config.config_notes : "",
    rubricBoardId: "",
    rubricSourceName: text(rubricSource.name),
    rubric,
    published: String(s.status ?? "").toUpperCase() === "PUBLISHED",
  };
}

export function ScenarioEditPageClient() {
  const params = useParams<{ scenarioId: string }>();
  const scenarioId = params.scenarioId;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<ScenarioInput | null>(null);

  const load = useCallback(async () => {
    if (!scenarioId) return;
    setLoading(true);
    setError(null);
    const res = await v1.get<{ scenario: Record<string, unknown> & { rubric_items?: RubricApi[] } }>(
      `scenarios/${scenarioId}`,
    );
    if (!res.ok) {
      setError(res.message);
      setInitial(null);
    } else {
      setInitial(mapScenario(res.data));
    }
    setLoading(false);
  }, [scenarioId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (!scenarioId) return <p className="text-[14px] text-[var(--muted)]">Missing scenario id.</p>;
  if (loading) return <p className="mx-auto max-w-3xl text-[14px] text-[var(--muted)]">Loading…</p>;
  if (!initial) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <p className="text-amber-900">{error ?? "Scenario not found."}</p>
        <Link href="/org/scenarios" className="underline">
          Back to scenarios
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/org/scenarios"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline"
        >
          Scenarios
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-3xl">Edit scenario</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">{initial.title}</p>
      </div>
      <ScenarioEditorForm mode="edit" initial={initial} />
    </div>
  );
}
