"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { UiSimulationKind } from "@/app/_lib/simulation-mappers";
import { uiKindToSessionMode } from "@/app/_lib/simulation-mappers";
import { v1 } from "@/app/_lib/v1-client";

import type { AgentPersonaApi } from "../_lib/agent-personas";
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
  openingMessage: string;
  successCriteria: string;
  feedbackGuidance: string;
  configNotes: string;
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
    openingMessage: "",
    successCriteria: "",
    feedbackGuidance: "",
    configNotes: "",
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
  const [openingMessage, setOpeningMessage] = useState(base.openingMessage);
  const [successCriteria, setSuccessCriteria] = useState(base.successCriteria);
  const [feedbackGuidance, setFeedbackGuidance] = useState(base.feedbackGuidance);
  const [configNotes, setConfigNotes] = useState(base.configNotes);
  const [published, setPublished] = useState(base.published);
  const [rubric, setRubric] = useState<RubricItem[]>(base.rubric);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [personas, setPersonas] = useState<AgentPersonaApi[]>([]);
  const [personaError, setPersonaError] = useState<string | null>(null);

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

  useEffect(() => {
    void loadPersonas();
  }, [loadPersonas]);

  const selectedPersona = useMemo(
    () => personas.find((p) => p.id === personaId) ?? null,
    [personas, personaId],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "new") {
        const res = await v1.post<CreateResult>("scenarios", {
          title,
          description: summary || undefined,
          persona_id: personaId || undefined,
          agent_role: agentRole,
          difficulty,
          status: published ? "PUBLISHED" : "DRAFT",
          estimated_minutes: Number(estMinutes) || 30,
          config: {
            learner_role: role,
            persona_name: selectedPersona?.name ?? personaName,
            persona_title: selectedPersona?.title ?? personaTitle,
            opening_message: openingMessage,
            success_criteria: successCriteria,
            feedback_guidance: feedbackGuidance,
            config_notes: configNotes,
            rubric_draft: rubric,
            session_mode: uiKindToSessionMode(simulationKind),
          },
        });
        if (!res.ok) {
          setError(res.message);
          return;
        }
        router.push(`/org/scenarios/${res.data.scenario.id}/edit`);
      } else {
        const res = await v1.patch<CreateResult>(`scenarios/${base.id}`, {
          title,
          description: summary || undefined,
          persona_id: personaId || null,
          agent_role: agentRole,
          difficulty,
          status: published ? "PUBLISHED" : "DRAFT",
          estimated_minutes: Number(estMinutes) || 30,
          config: {
            learner_role: role,
            persona_name: selectedPersona?.name ?? personaName,
            persona_title: selectedPersona?.title ?? personaTitle,
            opening_message: openingMessage,
            success_criteria: successCriteria,
            feedback_guidance: feedbackGuidance,
            config_notes: configNotes,
            rubric_draft: rubric,
            session_mode: uiKindToSessionMode(simulationKind),
          },
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
            <>
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
            </>
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
        <RubricEditor items={rubric} onChange={setRubric} />
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
