"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { OrgDifficulty, OrgRubricItem, OrgScenario, OrgSimulationKind } from "../_lib/org-mock-data";

import { RubricEditor } from "./rubric-editor";

type Props = {
  mode: "new" | "edit";
  initial: OrgScenario | null;
};

const difficulties: OrgDifficulty[] = ["Beginner", "Medium", "Advanced"];
const kinds: OrgSimulationKind[] = ["chat", "phone", "video"];

function blankScenario(): OrgScenario {
  return {
    id: "new",
    title: "",
    summary: "",
    role: "",
    difficulty: "Medium",
    kind: "chat",
    estMinutes: 12,
    configNotes: "",
    rubric: [
      { id: "r1", label: "Objective framing", description: "", weight: 25, order: 0 },
      { id: "r2", label: "Evidence use", description: "", weight: 25, order: 1 },
      { id: "r3", label: "Tone & register", description: "", weight: 25, order: 2 },
      { id: "r4", label: "Next steps", description: "", weight: 25, order: 3 },
    ],
    published: false,
    updatedAt: new Date().toISOString(),
  };
}

export function ScenarioEditorForm({ mode, initial }: Props) {
  const router = useRouter();
  const base = useMemo(() => (initial ? { ...initial } : blankScenario()), [initial]);
  const [title, setTitle] = useState(base.title);
  const [summary, setSummary] = useState(base.summary);
  const [role, setRole] = useState(base.role);
  const [difficulty, setDifficulty] = useState<OrgDifficulty>(base.difficulty);
  const [kind, setKind] = useState<OrgSimulationKind>(base.kind);
  const [estMinutes, setEstMinutes] = useState(String(base.estMinutes));
  const [configNotes, setConfigNotes] = useState(base.configNotes);
  const [published, setPublished] = useState(base.published);
  const [rubric, setRubric] = useState<OrgRubricItem[]>(base.rubric);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
    if (mode === "new") {
      router.push("/org/scenarios/org-scn-weekly/edit");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
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
            <label htmlFor="diff" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Difficulty
            </label>
            <select
              id="diff"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as OrgDifficulty)}
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="kind" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
              Simulation type
            </label>
            <select
              id="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as OrgSimulationKind)}
              className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
            >
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {k}
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
              Room config & constraints
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
        <button type="submit" className="sim-btn-accent px-6 py-3 font-mono text-[10px] uppercase">
          {mode === "new" ? "Create scenario" : "Save changes"}
        </button>
        {saved ? (
          <p className="text-[13px] text-[#166534]">
            Preview only — not persisted. New scenarios jump to a sample edit route for the demo.
          </p>
        ) : null}
      </div>
    </form>
  );
}
