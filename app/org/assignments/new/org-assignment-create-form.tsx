"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

type Props = {
  cohorts: { id: string; name: string }[];
  scenarios: { id: string; title: string }[];
};

type CreateResult = {
  assignment: { id: string };
  assignment_group_id?: string | null;
  created_count?: number;
};

function defaultDueValue(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(17, 0, 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function OrgAssignmentCreateForm({ cohorts, scenarios }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [cohortId, setCohortId] = useState(cohorts[0]?.id ?? "");
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? "");
  const [due, setDue] = useState(defaultDueValue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = Boolean(title.trim() && cohortId && scenarioId && due);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await v1.post<CreateResult>("assignments", {
        title,
        cohort_id: cohortId,
        type: "REFLECTION",
        instructions: `Scenario: ${scenarioId}`,
        content: {
          cohort_id: cohortId,
          scenario_id: scenarioId,
          scenario_title: scenarios.find((scenario) => scenario.id === scenarioId)?.title ?? "",
        },
        due_at: new Date(due).toISOString(),
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.push(`/org/assignments?created_count=${res.data.created_count ?? 1}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}
      <div>
        <label htmlFor="title" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Title
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Weekly update · cohort turn-in"
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <div>
        <label htmlFor="cohort" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Assign to cohort
        </label>
        <select
          id="cohort"
          value={cohortId}
          onChange={(e) => setCohortId(e.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        >
          {cohorts.length === 0 && <option value="">No cohorts available</option>}
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="scenario" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Scenario
        </label>
        <select
          id="scenario"
          value={scenarioId}
          onChange={(e) => setScenarioId(e.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        >
          {scenarios.length === 0 && <option value="">No scenarios available</option>}
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="due" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Due
        </label>
        <input
          id="due"
          type="datetime-local"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 font-mono text-[14px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !canSubmit}
        className="sim-btn-accent w-full px-6 py-3 font-mono text-[10px] uppercase disabled:opacity-50 sm:w-auto"
      >
        {submitting ? "Creating…" : "Create assignment"}
      </button>
      {cohorts.length === 0 || scenarios.length === 0 ? (
        <p className="text-[13px] leading-5 text-[var(--muted)]">
          Create at least one cohort with enrolled students and one scenario before assigning work.
        </p>
      ) : null}
    </form>
  );
}
