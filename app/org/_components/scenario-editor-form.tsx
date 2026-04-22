"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

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
  estMinutes: number;
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
    estMinutes: 12,
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

export function ScenarioEditorForm({ mode, initial }: Props) {
  const router = useRouter();
  const base = useMemo(() => (initial ? { ...initial } : blank()), [initial]);
  const [title, setTitle] = useState(base.title);
  const [summary, setSummary] = useState(base.summary);
  const [role, setRole] = useState(base.role);
  const [difficulty, setDifficulty] = useState<Difficulty>(base.difficulty);
  const [agentRole, setAgentRole] = useState<AgentRole>(base.agentRole);
  const [estMinutes, setEstMinutes] = useState(String(base.estMinutes));
  const [configNotes, setConfigNotes] = useState(base.configNotes);
  const [published, setPublished] = useState(base.published);
  const [rubric, setRubric] = useState<RubricItem[]>(base.rubric);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "new") {
        const res = await v1.post<CreateResult>("scenarios", {
          title,
          description: summary || undefined,
          agent_role: agentRole,
          difficulty,
          status: published ? "PUBLISHED" : "DRAFT",
          estimated_minutes: Number(estMinutes) || 30,
          config: {
            learner_role: role,
            config_notes: configNotes,
            rubric_draft: rubric,
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
          difficulty,
          status: published ? "PUBLISHED" : "DRAFT",
          estimated_minutes: Number(estMinutes) || 30,
          config: {
            learner_role: role,
            config_notes: configNotes,
            rubric_draft: rubric,
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
              AI agent persona
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
          <div>
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
