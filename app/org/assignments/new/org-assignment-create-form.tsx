"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OrgCohort, OrgScenario } from "../../_lib/org-mock-data";

type Props = {
  cohorts: OrgCohort[];
  scenarios: OrgScenario[];
  sampleAssignmentId: string;
};

export function OrgAssignmentCreateForm({ cohorts, scenarios, sampleAssignmentId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [cohortId, setCohortId] = useState(cohorts[0]?.id ?? "");
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? "");
  const [due, setDue] = useState("2026-04-30T17:00");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(`/org/assignments/${sampleAssignmentId}?created=1`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
          Cohort
        </label>
        <select
          id="cohort"
          value={cohortId}
          onChange={(e) => setCohortId(e.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        >
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
      <button type="submit" className="sim-btn-accent w-full px-6 py-3 font-mono text-[10px] uppercase sm:w-auto">
        Create assignment
      </button>
    </form>
  );
}
