"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

type AssignmentRow = { id: string; status: string };

export function AssignmentDetailForm({ assignment }: { assignment: AssignmentRow }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(assignment.status !== "PENDING" && assignment.status !== "pending");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await v1.post(`assignments/${assignment.id}/submit`, {
        content: text || null,
        files: [],
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-[13px] text-red-900">{error}</p>
      ) : null}
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
          <button
            type="submit"
            disabled={submitting}
            className="sim-btn-accent px-6 py-3 font-mono text-[10px] uppercase disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit follow-up"}
          </button>
        ) : (
          <p className="rounded-xl border border-[#166534]/30 bg-[#e6f4ea]/60 px-4 py-3 text-[14px] text-[#166534]">
            Submitted successfully.
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
