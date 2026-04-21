"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AssignmentRow } from "../../_lib/student-mock-data";

export function AssignmentDetailForm({ assignment }: { assignment: AssignmentRow }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(assignment.status !== "pending");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="submission" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Written follow-up
        </label>
        <textarea
          id="submission"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submitted}
          placeholder="Optional notes after your simulation (reflection, context for your instructor)…"
          className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] leading-relaxed text-[#111111] outline-none transition-shadow placeholder:text-[var(--faint)] focus-visible:shadow-[0_0_0_3px_var(--focus-ring)] disabled:bg-[var(--field)] disabled:text-[var(--muted)]"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        {!submitted ? (
          <button type="submit" className="sim-btn-accent px-6 py-3 font-mono text-[10px] uppercase">
            Submit follow-up
          </button>
        ) : (
          <p className="rounded-xl border border-[#166534]/30 bg-[#e6f4ea]/60 px-4 py-3 text-[14px] text-[#166534]">
            Preview only — submission is not sent. Wire your LMS or API to persist.
          </p>
        )}
        <button
          type="button"
          onClick={() => router.push("/assignments")}
          className="rounded-xl border border-[var(--rule-strong)] px-5 py-3 text-[12px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--field)] hover:text-[#111111]"
        >
          Back to list
        </button>
      </div>
    </form>
  );
}
