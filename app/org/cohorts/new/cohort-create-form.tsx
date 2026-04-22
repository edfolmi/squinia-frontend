"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { v1 } from "@/app/_lib/v1-client";

type CreateCohortData = { cohort: { id: string } };

export function CohortCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [weeks, setWeeks] = useState("8");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) return;

    const w = parseInt(weeks, 10);
    const hasWeeks = Number.isFinite(w) && w > 0;
    const starts_at = new Date().toISOString();
    const ends_at = hasWeeks
      ? new Date(Date.now() + w * 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    setSubmitting(true);
    const res = await v1.post<CreateCohortData>("cohorts", {
      name: trimmed,
      description: description.trim() || null,
      starts_at,
      ends_at,
    });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.message);
      return;
    }
    const id = res.data.cohort?.id;
    if (!id) {
      setError("API returned no cohort id.");
      return;
    }
    router.push(`/org/cohorts/${id}?created=1`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">{error}</p>
      ) : null}
      <div>
        <label htmlFor="name" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">
          Cohort name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          placeholder="e.g. Spring 26 · Leadership lab"
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[#111111] outline-none transition-shadow placeholder:text-[var(--faint)] focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <div>
        <label
          htmlFor="weeks"
          className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]"
        >
          Program length (weeks)
        </label>
        <input
          id="weeks"
          type="number"
          min={1}
          max={52}
          value={weeks}
          onChange={(ev) => setWeeks(ev.target.value)}
          className="w-full rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 font-mono text-[15px] text-[#111111] outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <div>
        <label
          htmlFor="desc"
          className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]"
        >
          Description
        </label>
        <textarea
          id="desc"
          rows={3}
          value={description}
          onChange={(ev) => setDescription(ev.target.value)}
          placeholder="Who is this cohort for?"
          className="w-full resize-y rounded-xl border border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3 text-[15px] leading-relaxed text-[#111111] outline-none transition-shadow placeholder:text-[var(--faint)] focus-visible:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="sim-btn-accent w-full px-6 py-3 font-mono text-[10px] uppercase sm:w-auto disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create cohort"}
      </button>
    </form>
  );
}
