"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { UiSimulationKind } from "@/app/_lib/simulation-mappers";
import { uiKindToSessionMode } from "@/app/_lib/simulation-mappers";
import { v1 } from "@/app/_lib/v1-client";

import type { AgentPersonaApi, PersonaGender } from "../_lib/agent-personas";
import { VOICE_OPTIONS } from "../_lib/agent-personas";
import type { RubricBoardApi } from "../_lib/rubrics";
import { sortedRubricItems } from "../_lib/rubrics";
import { PersonaAvatar } from "./persona-avatar";
import { RubricEditor } from "./rubric-editor";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type AgentRole = "TECHNICAL_INTERVIEWER" | "HR_RECRUITER" | "PRODUCT_MANAGER" | "PEER_DEVELOPER" | "CLIENT_STAKEHOLDER";

type RubricItem = { id: string; label: string; description: string; weight: number; order: number };

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
  rubric: RubricItem[];
  published: boolean;
};

type Props = {
  mode: "new" | "edit";
  initial: ScenarioInput | null;
};

const difficulties: { value: Difficulty; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const simulationFormats: { value: UiSimulationKind; title: string; hint: string }[] = [
  { value: "chat", title: "Chat", hint: "Text transcript — typing and reading, like messaging." },
  { value: "phone", title: "Phone", hint: "Voice-only — microphone and speaker, no camera." },
  { value: "video", title: "Video", hint: "Camera (and optional screen share) for presence practice." },
];

const agentRoles: { value: AgentRole; label: string }[] = [
  { value: "TECHNICAL_INTERVIEWER", label: "Technical Interviewer" },
  { value: "HR_RECRUITER", label: "HR Recruiter" },
  { value: "PRODUCT_MANAGER", label: "Product Manager" },
  { value: "PEER_DEVELOPER", label: "Peer Developer" },
  { value: "CLIENT_STAKEHOLDER", label: "Client Stakeholder" },
];

const genders: { value: PersonaGender; label: string }[] = [
  { value: "UNSPECIFIED", label: "Unspecified" },
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "NON_BINARY", label: "Non-binary" },
];

const MAX_AVATAR_BYTES = 750 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function blank(): ScenarioInput {
  return {
    id: "new",
    title: "",
    summary: "",
    role: "",
    difficulty: "INTERMEDIATE",
    agentRole: "TECHNICAL_INTERVIEWER",
    personaId: "",
    simulationKind: "chat",
    estMinutes: 12,
    personaName: "",
    personaTitle: "",
    personaGender: "UNSPECIFIED",
    personaAvatarUrl: "",
    personaVoiceId: "",
    personaPersonality: "",
    personaCommunicationStyle: "",
    personaBackground: "",
    openingMessage: "",
    successCriteria: "",
    feedbackGuidance: "",
    configNotes: "",
    rubricBoardId: "",
    rubricSourceName: "",
    rubric: [
      { id: "r1", label: "Objective framing", description: "", weight: 25, order: 0 },
      { id: "r2", label: "Evidence use", description: "", weight: 25, order: 1 },
      { id: "r3", label: "Tone & register", description: "", weight: 25, order: 2 },
      { id: "r4", label: "Next steps", description: "", weight: 25, order: 3 },
    ],
    published: false,
  };
}

type CreateResult = { scenario: { id: string } };
type PersonasResult = { items: AgentPersonaApi[] };
type RubricsResult = { items: RubricBoardApi[] };

type ScenarioDraft = {
  title?: string;
  summary?: string;
  learner_role?: string;
  difficulty?: Difficulty;
  agent_role?: AgentRole;
  simulation_kind?: UiSimulationKind;
  estimated_minutes?: number;
  opening_message?: string;
  success_criteria?: string;
  feedback_guidance?: string;
  config_notes?: string;
  persona?: {
    mode?: "saved" | "custom";
    persona_id?: string | null;
    name?: string;
    title?: string;
    gender?: PersonaGender;
    personality?: string;
    communication_style?: string;
    background?: string;
    voice_id?: string;
  };
  rubric?: {
    mode?: "saved" | "custom";
    rubric_board_id?: string | null;
    items?: Array<{ criterion?: string; description?: string | null; weight?: number; sort_order?: number }>;
  };
};

function rubricBoardToItems(board: RubricBoardApi): RubricItem[] {
  return sortedRubricItems(board.items ?? []).map((item, index) => ({
    id: item.id,
    label: item.criterion,
    description: item.description ?? "",
    weight: item.weight,
    order: typeof item.sort_order === "number" ? item.sort_order : index,
  }));
}

function rubricItemsPayload(items: RubricItem[]) {
  return [...items].sort((a, b) => a.order - b.order).map((item, sort_order) => ({
    criterion: item.label,
    description: item.description || undefined,
    max_score: 10,
    weight: item.weight,
    sort_order,
  }));
}

export function ScenarioEditorForm({ mode, initial }: Props) {
  const router = useRouter();
  const base = useMemo(() => (initial ? { ...initial } : blank()), [initial]);
  const [title, setTitle] = useState(base.title);
  const [summary, setSummary] = useState(base.summary);
  const [role, setRole] = useState(base.role);
  const [difficulty, setDifficulty] = useState<Difficulty>(base.difficulty);
  const [agentRole, setAgentRole] = useState<AgentRole>(base.agentRole);
  const [personaId, setPersonaId] = useState(base.personaId);
  const [simulationKind, setSimulationKind] = useState<UiSimulationKind>(base.simulationKind);
  const [estMinutes, setEstMinutes] = useState(String(base.estMinutes));
  const [personaName, setPersonaName] = useState(base.personaName);
  const [personaTitle, setPersonaTitle] = useState(base.personaTitle);
  const [personaGender, setPersonaGender] = useState<PersonaGender>(base.personaGender);
  const [personaAvatarUrl, setPersonaAvatarUrl] = useState(base.personaAvatarUrl);
  const [personaAvatarFileName, setPersonaAvatarFileName] = useState("");
  const [personaVoiceId, setPersonaVoiceId] = useState(base.personaVoiceId);
  const [personaPersonality, setPersonaPersonality] = useState(base.personaPersonality);
  const [personaCommunicationStyle, setPersonaCommunicationStyle] = useState(base.personaCommunicationStyle);
  const [personaBackground, setPersonaBackground] = useState(base.personaBackground);
  const [openingMessage, setOpeningMessage] = useState(base.openingMessage);
  const [successCriteria, setSuccessCriteria] = useState(base.successCriteria);
  const [feedbackGuidance, setFeedbackGuidance] = useState(base.feedbackGuidance);
  const [configNotes, setConfigNotes] = useState(base.configNotes);
  const [published, setPublished] = useState(base.published);
  const [rubricBoardId, setRubricBoardId] = useState(base.rubricBoardId);
  const [rubric, setRubric] = useState<RubricItem[]>(base.rubric);
  const [aiPrompt, setAiPrompt] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [personas, setPersonas] = useState<AgentPersonaApi[]>([]);
  const [personaError, setPersonaError] = useState<string | null>(null);
  const [rubricBoards, setRubricBoards] = useState<RubricBoardApi[]>([]);
  const [rubricError, setRubricError] = useState<string | null>(null);

  const loadPersonas = useCallback(async () => {
    const res = await v1.get<PersonasResult>("agent-personas");
    if (!res.ok) {
      setPersonaError(res.message);
      setPersonas([]);
      return;
    }
    setPersonaError(null);
    setPersonas(res.data.items ?? []);
    if (!base.personaId) {
      const defaultPersona = (res.data.items ?? []).find((p) => p.is_default);
      if (defaultPersona) setPersonaId(defaultPersona.id);
    }
  }, [base.personaId]);

  const loadRubrics = useCallback(async () => {
    const res = await v1.get<RubricsResult>("rubrics");
    if (!res.ok) {
      setRubricError(res.message);
      setRubricBoards([]);
      return;
    }
    setRubricError(null);
    setRubricBoards(res.data.items ?? []);
    if (mode === "new" && !base.rubricBoardId) {
      const defaultRubric = (res.data.items ?? []).find((r) => r.is_default);
      if (defaultRubric) setRubricBoardId(defaultRubric.id);
    }
  }, [base.rubricBoardId, mode]);

  useEffect(() => {
    void Promise.resolve().then(loadPersonas);
  }, [loadPersonas]);

  useEffect(() => {
    void Promise.resolve().then(loadRubrics);
  }, [loadRubrics]);

  const selectedPersona = useMemo(
    () => personas.find((p) => p.id === personaId) ?? null,
    [personas, personaId],
  );
  const selectedRubric = useMemo(
    () => rubricBoards.find((r) => r.id === rubricBoardId) ?? null,
    [rubricBoards, rubricBoardId],
  );

  function onPersonaAvatarFile(file: File | null) {
    setError(null);
    if (!file) return;
    if (!AVATAR_TYPES.has(file.type)) {
      setError("Please upload a JPG, PNG, WEBP, or GIF persona image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Please choose a persona image smaller than 750 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPersonaAvatarUrl(reader.result);
        setPersonaAvatarFileName(file.name);
      }
    };
    reader.onerror = () => setError("We could not read that persona image. Please try another file.");
    reader.readAsDataURL(file);
  }

  function oneOffPersonaConfig() {
    if (selectedPersona) return null;
    const persona = {
      name: personaName.trim(),
      title: personaTitle.trim(),
      gender: personaGender,
      avatar_url: personaAvatarUrl.trim(),
      voice_provider: "deepgram",
      voice_id: personaVoiceId.trim(),
      personality: personaPersonality.trim(),
      communication_style: personaCommunicationStyle.trim(),
      background: personaBackground.trim(),
    };
    return Object.fromEntries(Object.entries(persona).filter(([, value]) => Boolean(value)));
  }

  function scenarioConfig() {
    const customPersona = oneOffPersonaConfig();
    return {
      learner_role: role,
      persona: customPersona ?? undefined,
      persona_name: selectedPersona?.name ?? personaName,
      persona_title: selectedPersona?.title ?? personaTitle,
      persona_gender: selectedPersona?.gender ?? personaGender,
      persona_avatar_url: selectedPersona?.avatar_url ?? personaAvatarUrl,
      persona_voice_id: selectedPersona?.voice_id ?? personaVoiceId,
      persona_personality: selectedPersona?.personality ?? personaPersonality,
      persona_communication_style: selectedPersona?.communication_style ?? personaCommunicationStyle,
      persona_background: selectedPersona?.background ?? personaBackground,
      opening_message: openingMessage,
      success_criteria: successCriteria,
      feedback_guidance: feedbackGuidance,
      config_notes: configNotes,
      session_mode: uiKindToSessionMode(simulationKind),
    };
  }

  function scenarioPayload() {
    return {
      title,
      description: summary || undefined,
      persona_id: personaId || undefined,
      agent_role: agentRole,
      difficulty,
      status: published ? "PUBLISHED" : "DRAFT",
      estimated_minutes: Number(estMinutes) || 30,
      config: scenarioConfig(),
      rubric_board_id: rubricBoardId || undefined,
      rubric_items: rubricBoardId ? undefined : rubricItemsPayload(rubric),
    };
  }

  function applyDraft(draft: ScenarioDraft) {
    setTitle(draft.title ?? title);
    setSummary(draft.summary ?? summary);
    setRole(draft.learner_role ?? role);
    if (draft.difficulty) setDifficulty(draft.difficulty);
    if (draft.agent_role) setAgentRole(draft.agent_role);
    if (draft.simulation_kind) setSimulationKind(draft.simulation_kind);
    if (draft.estimated_minutes) setEstMinutes(String(draft.estimated_minutes));
    setOpeningMessage(draft.opening_message ?? openingMessage);
    setSuccessCriteria(draft.success_criteria ?? successCriteria);
    setFeedbackGuidance(draft.feedback_guidance ?? feedbackGuidance);
    setConfigNotes(draft.config_notes ?? configNotes);

    if (draft.persona?.mode === "saved" && draft.persona.persona_id) {
      setPersonaId(draft.persona.persona_id);
    } else if (draft.persona) {
      setPersonaId("");
      setPersonaName(draft.persona.name ?? "");
      setPersonaTitle(draft.persona.title ?? "");
      setPersonaGender(draft.persona.gender ?? "UNSPECIFIED");
      setPersonaVoiceId(draft.persona.voice_id ?? "");
      setPersonaPersonality(draft.persona.personality ?? "");
      setPersonaCommunicationStyle(draft.persona.communication_style ?? "");
      setPersonaBackground(draft.persona.background ?? "");
    }

    if (draft.rubric?.mode === "saved" && draft.rubric.rubric_board_id) {
      setRubricBoardId(draft.rubric.rubric_board_id);
    } else if (draft.rubric?.items?.length) {
      setRubricBoardId("");
      setRubric(
        draft.rubric.items.map((item, index) => ({
          id: `ai-${Date.now().toString(36)}-${index}`,
          label: item.criterion || "New criterion",
          description: item.description ?? "",
          weight: item.weight ?? 25,
          order: typeof item.sort_order === "number" ? item.sort_order : index,
        })),
      );
    }
  }

  async function onDraftWithAi() {
    setError(null);
    setDraftNotice(null);
    const prompt = aiPrompt.trim();
    if (prompt.length < 10) {
      setError("Describe the scenario you want in at least 10 characters.");
      return;
    }
    setDrafting(true);
    try {
      const res = await v1.post<{ draft: ScenarioDraft }>("scenarios/draft-with-ai", {
        prompt,
        existing_persona_ids: personas.map((p) => p.id),
        existing_rubric_ids: rubricBoards.map((r) => r.id),
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      applyDraft(res.data.draft);
      setDraftNotice("Draft applied. Review the scenario, persona, and rubric before saving.");
    } finally {
      setDrafting(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "new") {
        const res = await v1.post<CreateResult>("scenarios", scenarioPayload());
        if (!res.ok) {
          setError(res.message);
          return;
        }
        router.push(`/org/scenarios/${res.data.scenario.id}/edit`);
      } else {
        const payload = scenarioPayload();
        const res = await v1.patch<CreateResult>(`scenarios/${base.id}`, {
          ...payload,
          persona_id: personaId || null,
          rubric_board_id: rubricBoardId || null,
        });
        if (!res.ok) {
          setError(res.message);
          return;
        }
        setSaved(true);
        window.setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}
      {draftNotice ? (
        <p className="rounded-xl border border-[#b7e4c4] bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#166534]">{draftNotice}</p>
      ) : null}

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">AI scenario draft</h2>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--muted)]">
              Describe the practice room and Squinia will fill the scenario, custom persona, and rubric fields for review.
            </p>
          </div>
          <button
            type="button"
            onClick={onDraftWithAi}
            disabled={drafting}
            className="sim-btn-accent shrink-0 px-5 py-2.5 font-mono text-[10px] uppercase disabled:opacity-50"
          >
            {drafting ? "Drafting..." : "Generate draft"}
          </button>
        </div>
        <textarea
          rows={4}
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="e.g. Create a senior backend system design interview where the learner must defend tradeoffs for a payments outage recovery plan."
          className="mt-5 w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Basics</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Title
            </label>
            <input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="summary" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Summary
            </label>
            <textarea
              id="summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <div>
            <label htmlFor="role" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Learner role
            </label>
            <input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Engineering lead"
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <div>
            <label htmlFor="agentRole" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Agent role type
            </label>
            <select
              id="agentRole"
              value={agentRole}
              onChange={(e) => setAgentRole(e.target.value as AgentRole)}
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            >
              {agentRoles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="personaId" className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                Saved persona
              </label>
              <Link href="/org/personas/new" className="text-[12px] font-medium text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline">
                Create persona
              </Link>
            </div>
            <select
              id="personaId"
              value={personaId}
              onChange={(e) => setPersonaId(e.target.value)}
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            >
              <option value="">Custom persona for this scenario</option>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.title ? ` - ${p.title}` : ""}
                </option>
              ))}
            </select>
            {personaError ? <p className="mt-2 text-[12px] text-amber-700">{personaError}</p> : null}
            {selectedPersona ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--rule)] bg-[var(--field)]/50 px-3 py-3">
                <PersonaAvatar name={selectedPersona.name} src={selectedPersona.avatar_url} size="sm" />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#111111]">{selectedPersona.name}</p>
                  <p className="truncate text-[13px] text-[var(--muted)]">
                    {selectedPersona.title || "Simulation partner"} · {selectedPersona.gender.toLowerCase().replace("_", " ")}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          {!selectedPersona ? (
            <div className="sm:col-span-2">
              <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5">
                <div className="flex items-center gap-4">
                  <PersonaAvatar name={personaName || "Persona"} src={personaAvatarUrl} size="lg" />
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">
                      {personaName || "One-off persona"}
                    </h3>
                    <p className="mt-1 text-[14px] text-[var(--muted)]">
                      {personaTitle || "Scenario-specific simulation partner"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="personaName" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                      One-off persona name
                    </label>
                    <input
                      id="personaName"
                      value={personaName}
                      onChange={(e) => setPersonaName(e.target.value)}
                      placeholder="e.g. Julia Merrick"
                      className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
                    />
                  </div>
                  <div>
                    <label htmlFor="personaTitle" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                      One-off persona title
                    </label>
                    <input
                      id="personaTitle"
                      value={personaTitle}
                      onChange={(e) => setPersonaTitle(e.target.value)}
                      placeholder="e.g. Technical team lead"
                      className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
                    />
                  </div>
                  <div>
                    <label htmlFor="personaGender" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                      Presentation
                    </label>
                    <select
                      id="personaGender"
                      value={personaGender}
                      onChange={(e) => setPersonaGender(e.target.value as PersonaGender)}
                      className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
                    >
                      {genders.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="personaVoice" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                      Call voice
                    </label>
                    <select
                      id="personaVoice"
                      value={personaVoiceId}
                      onChange={(e) => setPersonaVoiceId(e.target.value)}
                      className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
                    >
                      {VOICE_OPTIONS.map((v) => (
                        <option key={v.value || "auto"} value={v.value}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                      Avatar image
                    </span>
                    <div className="rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <PersonaAvatar name={personaName || "Persona"} src={personaAvatarUrl} size="lg" />
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor="personaAvatarFile"
                            className="inline-flex cursor-pointer items-center rounded-xl border border-[var(--rule-strong)] px-4 py-2.5 text-[13px] font-medium text-[#111111] transition-colors hover:bg-[var(--field)]"
                          >
                            Upload image
                          </label>
                          <input
                            id="personaAvatarFile"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={(e) => onPersonaAvatarFile(e.target.files?.[0] ?? null)}
                            className="sr-only"
                          />
                          <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">
                            JPG, PNG, WEBP, or GIF. Keep it under 750 KB.
                            {personaAvatarFileName ? ` Selected: ${personaAvatarFileName}` : ""}
                          </p>
                        </div>
                        {personaAvatarUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPersonaAvatarUrl("");
                              setPersonaAvatarFileName("");
                            }}
                            className="rounded-xl px-3 py-2 text-[12px] font-medium text-[var(--muted)] hover:bg-[var(--field)] hover:text-[#111111]"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="personaPersonality" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                      Personality
                    </label>
                    <textarea
                      id="personaPersonality"
                      rows={3}
                      value={personaPersonality}
                      onChange={(e) => setPersonaPersonality(e.target.value)}
                      placeholder="Direct, fair, calm under pressure, asks for specifics."
                      className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="personaStyle" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                      Communication style
                    </label>
                    <textarea
                      id="personaStyle"
                      rows={3}
                      value={personaCommunicationStyle}
                      onChange={(e) => setPersonaCommunicationStyle(e.target.value)}
                      placeholder="Concise, realistic, asks one follow-up at a time."
                      className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="personaBackground" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
                      Background
                    </label>
                    <textarea
                      id="personaBackground"
                      rows={3}
                      value={personaBackground}
                      onChange={(e) => setPersonaBackground(e.target.value)}
                      placeholder="Context the AI should remember whenever this scenario persona is used."
                      className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <div className={selectedPersona ? "" : ""}>
            <label htmlFor="diff" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Difficulty
            </label>
            <select
              id="diff"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            >
              {difficulties.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="est" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Est. minutes
            </label>
            <input
              id="est"
              type="number"
              min={1}
              max={120}
              value={estMinutes}
              onChange={(e) => setEstMinutes(e.target.value)}
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 font-mono text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="mb-3 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Simulation format
            </legend>
            <p className="mb-3 text-[13px] leading-relaxed text-[var(--muted)]">
              Learners open this format when they start a new attempt from Scenarios or an assignment.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {simulationFormats.map((fmt) => {
                const selected = simulationKind === fmt.value;
                return (
                  <label
                    key={fmt.value}
                    className={`cursor-pointer rounded-2xl border px-4 py-3 transition-colors ${
                      selected
                        ? "border-[#166534] bg-[#e6f4ea]/50 ring-1 ring-[#166534]/30"
                        : "border-[var(--rule-strong)] bg-[var(--surface)] hover:border-[var(--rule)] hover:bg-[var(--field)]/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="simulationKind"
                      value={fmt.value}
                      checked={selected}
                      onChange={() => setSimulationKind(fmt.value)}
                      className="sr-only"
                    />
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">{fmt.title}</p>
                    <p className="mt-2 text-[13px] leading-snug text-[var(--muted)]">{fmt.hint}</p>
              </label>
            );
          })}
            </div>
          </fieldset>
          <div className="sm:col-span-2">
            <label htmlFor="opening" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Agent opening
            </label>
            <textarea
              id="opening"
              rows={3}
              value={openingMessage}
              onChange={(e) => setOpeningMessage(e.target.value)}
              placeholder="The first in-character thing the agent should say when the learner enters."
              className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="success" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Success criteria
            </label>
            <textarea
              id="success"
              rows={3}
              value={successCriteria}
              onChange={(e) => setSuccessCriteria(e.target.value)}
              placeholder="What a strong learner should demonstrate in this scenario."
              className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="feedbackGuidance" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Feedback guidance
            </label>
            <textarea
              id="feedbackGuidance"
              rows={3}
              value={feedbackGuidance}
              onChange={(e) => setFeedbackGuidance(e.target.value)}
              placeholder="What the evaluation should pay special attention to after this scenario."
              className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cfg" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Room config &amp; constraints
            </label>
            <textarea
              id="cfg"
              rows={4}
              value={configNotes}
              onChange={(e) => setConfigNotes(e.target.value)}
              placeholder="Time limits, persona notes, tools allowed, policy hints for the model…"
              className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-relaxed text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 rounded border-[var(--rule-strong)]" />
            <span className="text-[14px] text-[var(--muted)]">Published to library (learners can be assigned this scenario)</span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <label htmlFor="rubricBoardId" className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Saved rubric
          </label>
          <Link href="/org/rubrics/new" className="text-[12px] font-medium text-[var(--muted)] underline-offset-4 hover:text-[#111111] hover:underline">
            Create rubric
          </Link>
        </div>
        <select
          id="rubricBoardId"
          value={rubricBoardId}
          onChange={(e) => setRubricBoardId(e.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        >
          <option value="">Custom rubric for this scenario</option>
          {rubricBoards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}{board.is_default ? " - default" : ""}
            </option>
          ))}
        </select>
        {rubricError ? <p className="mt-2 text-[12px] text-amber-700">{rubricError}</p> : null}
        {base.rubricSourceName && !selectedRubric ? (
          <p className="mt-3 text-[12px] text-[var(--muted)]">This scenario rubric was originally copied from {base.rubricSourceName}.</p>
        ) : null}
        <div className="mt-5">
          {selectedRubric ? (
            <div className="rounded-2xl border border-[var(--rule)] bg-[var(--field)]/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#111111]">{selectedRubric.name}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted)]">
                    {selectedRubric.description || "This board will be copied into the scenario when you save."}
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--faint)]">
                  {selectedRubric.items?.length ?? 0} criteria
                </span>
              </div>
              <ul className="mt-4 space-y-2">
                {rubricBoardToItems(selectedRubric).map((item) => (
                  <li key={item.id} className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] px-3 py-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-medium text-[#111111]">{item.label}</p>
                        {item.description ? <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">{item.description}</p> : null}
                      </div>
                      <span className="font-mono text-[10px] text-[var(--faint)]">Weight {item.weight}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <RubricEditor items={rubric} onChange={setRubric} />
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="sim-btn-accent px-6 py-3 font-mono text-[10px] uppercase disabled:opacity-50"
        >
          {submitting ? "Saving…" : mode === "new" ? "Create scenario" : "Save changes"}
        </button>
        {saved ? (
          <p className="text-[13px] text-[#166534]">Changes saved.</p>
        ) : null}
      </div>
    </form>
  );
}
