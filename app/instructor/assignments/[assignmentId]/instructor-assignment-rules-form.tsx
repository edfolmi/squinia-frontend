"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { dispatchAssignmentRulesChanged } from "@/app/(student)/_hooks/use-effective-assignment-rules";
import type { AssignmentRow } from "@/app/(student)/_lib/student-mock-data";
import {
  getEffectiveAssignmentRules,
  normalizeRules,
  saveAssignmentRules,
} from "@/app/_lib/assignment-rules-storage";

type Props = {
  assignment: AssignmentRow;
};

export function InstructorAssignmentRulesForm({ assignment }: Props) {
  const router = useRouter();
  const defaults = normalizeRules({
    maxAttempts: assignment.maxAttempts,
    minScorePercent: assignment.minScorePercent,
  });
  const [maxAttempts, setMaxAttempts] = useState(String(defaults.maxAttempts));
  const [minScorePercent, setMinScorePercent] = useState(String(defaults.minScorePercent));
  const [effective, setEffective] = useState(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const e = getEffectiveAssignmentRules(assignment.id, {
        maxAttempts: assignment.maxAttempts,
        minScorePercent: assignment.minScorePercent,
      });
      setEffective(e);
      setMaxAttempts(String(e.maxAttempts));
      setMinScorePercent(String(e.minScorePercent));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [assignment.id, assignment.maxAttempts, assignment.minScorePercent]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = normalizeRules({
      maxAttempts: Number(maxAttempts),
      minScorePercent: Number(minScorePercent),
    });
    saveAssignmentRules(assignment.id, parsed);
    setEffective(parsed);
    setMaxAttempts(String(parsed.maxAttempts));
    setMinScorePercent(String(parsed.minScorePercent));
    dispatchAssignmentRulesChanged();
    setSaved(true);
    router.refresh();
    window.setTimeout(() => setSaved(false), 3200);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="maxAttempts"
            className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]"
          >
            Max attempts
          </label>
          <input
            id="maxAttempts"
            type="number"
            min={1}
            max={99}
            required
            value={maxAttempts}
            onChange={(ev) => setMaxAttempts(ev.target.value)}
            className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 font-mono text-[15px] text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">
            Each start counts as one attempt (unique session id per run).
          </p>
        </div>
        <div>
          <label
            htmlFor="minScorePercent"
            className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]"
          >
            Minimum score (%)
          </label>
          <input
            id="minScorePercent"
            type="number"
            min={0}
            max={100}
            required
            value={minScorePercent}
            onChange={(ev) => setMinScorePercent(ev.target.value)}
            className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 font-mono text-[15px] text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">
            Learners should reach at least this percentage on a simulation report (best attempt).
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--rule)] bg-[var(--field)]/50 px-4 py-3 text-[13px] text-[var(--muted)]">
        <span className="font-medium text-[#111111]">Active rules:</span> max{" "}
        <span className="font-mono tabular-nums">{effective.maxAttempts}</span> attempts, min score{" "}
        <span className="font-mono tabular-nums">{effective.minScorePercent}%</span>
        {effective.maxAttempts !== assignment.maxAttempts || effective.minScorePercent !== assignment.minScorePercent
          ? " (custom override active)."
          : "."}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="sim-btn-accent px-6 py-3 font-mono text-[10px] uppercase">
          Save rules
        </button>
        {saved ? (
          <p className="text-[13px] text-[#166534]">Rules saved.</p>
        ) : null}
      </div>
    </form>
  );
}
